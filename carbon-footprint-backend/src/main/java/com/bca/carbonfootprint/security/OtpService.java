package com.bca.carbonfootprint.security;

import com.bca.carbonfootprint.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    @Autowired
    private EmailService emailService;

    @Value("${app.auth.dev-otp-console-fallback:true}")
    private boolean devOtpConsoleFallback;

    // In-memory storage
    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    // ================= GENERATE OTP =================
    public String generateOtp(String username) {

        // Normalize email (IMPORTANT FIX)
        username = username.trim().toLowerCase();

        Random random = new Random();
        String otp = String.valueOf(100000 + random.nextInt(900000));

        OtpData otpData =
                new OtpData(otp, LocalDateTime.now().plusMinutes(5));

        otpStorage.put(username, otpData);

        sendOtpEmailAsync(username, otp);

        System.out.println("🔐 OTP stored for: " + username);
        System.out.println("📦 Current OTP storage keys: " + otpStorage.keySet());

        return otp;
    }

    private void sendOtpEmailAsync(String username, String otp) {
        CompletableFuture.runAsync(() -> {
            try {
                emailService.sendOtpEmail(username, otp);
            } catch (Exception ex) {
                System.err.println("OTP email send failed for " + username + ": " + ex.getMessage());
                if (ex.getCause() != null) {
                    System.err.println("Mail root cause: " + ex.getCause().getMessage());
                }
                if (devOtpConsoleFallback) {
                    System.out.println("OTP email failed. DEV fallback is enabled.");
                    System.out.println("Use this OTP for " + username + ": " + otp);
                } else {
                    otpStorage.remove(username);
                }
            }
        });
    }

    // ================= VALIDATE OTP =================
    public boolean validateOtp(String username, String otp) {

        // Normalize email (IMPORTANT FIX)
        username = username.trim().toLowerCase();

        System.out.println("📩 Email received for verification: " + username);
        System.out.println("🔢 OTP received: " + otp);
        System.out.println("📦 Available OTP keys: " + otpStorage.keySet());

        OtpData otpData = otpStorage.get(username);

        if (otpData == null) {
            System.out.println("❌ No OTP found for this email.");
            return false;
        }

        if (otpData.isExpired()) {
            System.out.println("❌ OTP expired.");
            return false;
        }

        boolean matches = otpData.getOtp().equals(otp);

        if (!matches) {
            System.out.println("❌ OTP does not match.");
        } else {
            System.out.println("✅ OTP validated successfully.");
        }

        return matches;
    }

    // ================= CLEAR OTP =================
    public void clearOtp(String username) {
        username = username.trim().toLowerCase();
        otpStorage.remove(username);
    }
}
