package com.bca.carbonfootprint.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.bca.carbonfootprint.dto.PlateOcrResponse;

import net.sourceforge.tess4j.Tesseract;

@Service
public class PlateOcrService {

    private static final Pattern DATA_URL_PATTERN = Pattern.compile("^data:image/(png|jpeg|jpg|webp);base64,(.+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern INDIAN_PLATE_PATTERN = Pattern.compile("[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}");
    private static final int MAX_IMAGE_DATA_URL_LENGTH = 2_800_000;

    public PlateOcrResponse recognizePlate(String imageDataUrl) {
        if (!StringUtils.hasText(imageDataUrl)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evidence image is required");
        }
        if (imageDataUrl.length() > MAX_IMAGE_DATA_URL_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evidence image is too large");
        }

        Matcher matcher = DATA_URL_PATTERN.matcher(imageDataUrl.trim());
        if (!matcher.matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evidence image must be a JPEG, PNG, or WebP data URL");
        }

        try {
            byte[] imageBytes = Base64.getDecoder().decode(matcher.group(2));
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (image == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evidence image could not be decoded");
            }

            Tesseract tesseract = new Tesseract();
            tesseract.setLanguage("eng");
            tesseract.setPageSegMode(7);
            tesseract.setTessVariable("tessedit_char_whitelist", "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");

            String rawText = tesseract.doOCR(image);
            String plate = extractPlate(rawText);
            double confidence = plate.isBlank() ? 0 : 72;
            return new PlateOcrResponse(rawText != null ? rawText.trim() : "", plate, confidence);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Backend OCR is unavailable. Install Tesseract language data or use browser OCR fallback."
            );
        }
    }

    private String extractPlate(String rawText) {
        if (!StringUtils.hasText(rawText)) {
            return "";
        }
        String normalized = rawText.toUpperCase().replaceAll("[^A-Z0-9]", "");
        Matcher matcher = INDIAN_PLATE_PATTERN.matcher(normalized);
        return matcher.find() ? matcher.group() : "";
    }
}
