package com.bca.carbonfootprint.dto;

public class PlateOcrResponse {

    private String rawText;
    private String plateNumber;
    private double confidence;

    public PlateOcrResponse(String rawText, String plateNumber, double confidence) {
        this.rawText = rawText;
        this.plateNumber = plateNumber;
        this.confidence = confidence;
    }

    public String getRawText() {
        return rawText;
    }

    public String getPlateNumber() {
        return plateNumber;
    }

    public double getConfidence() {
        return confidence;
    }
}
