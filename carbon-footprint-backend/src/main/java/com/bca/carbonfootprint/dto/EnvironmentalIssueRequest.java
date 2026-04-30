package com.bca.carbonfootprint.dto;

import java.time.LocalDateTime;

import com.bca.carbonfootprint.model.IssueType;

public class EnvironmentalIssueRequest {

    private String title;
    private String description;
    private IssueType issueType;
    private Integer severity;
    private Double latitude;
    private Double longitude;
    private String address;
    private String mappedZoneName;
    private LocalDateTime captureTimestamp;
    private String mediaType;
    private String detectionModel;
    private Boolean onDeviceInference;
    private String smokeColor;
    private String wasteType;
    private String aiSeverityLabel;
    private String aiPriority;
    private Double mediaDurationSeconds;
    private Double aiScore;
    private Double aiConfidenceScore;
    private Double rollingAverageScore;
    private Double estimatedCarbonGrams;
    private String carbonEstimateLabel;
    private String carbonEstimateMethod;
    private Integer vehicleCount;
    private Integer frameSampleCount;
    private String vehiclePlateNumber;
    private String aiSummary;
    private String evidenceImageUrl;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public IssueType getIssueType() {
        return issueType;
    }

    public void setIssueType(IssueType issueType) {
        this.issueType = issueType;
    }

    public Integer getSeverity() {
        return severity;
    }

    public void setSeverity(Integer severity) {
        this.severity = severity;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getMappedZoneName() {
        return mappedZoneName;
    }

    public void setMappedZoneName(String mappedZoneName) {
        this.mappedZoneName = mappedZoneName;
    }

    public LocalDateTime getCaptureTimestamp() {
        return captureTimestamp;
    }

    public void setCaptureTimestamp(LocalDateTime captureTimestamp) {
        this.captureTimestamp = captureTimestamp;
    }

    public String getMediaType() {
        return mediaType;
    }

    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }

    public String getDetectionModel() {
        return detectionModel;
    }

    public void setDetectionModel(String detectionModel) {
        this.detectionModel = detectionModel;
    }

    public Boolean getOnDeviceInference() {
        return onDeviceInference;
    }

    public void setOnDeviceInference(Boolean onDeviceInference) {
        this.onDeviceInference = onDeviceInference;
    }

    public String getSmokeColor() {
        return smokeColor;
    }

    public void setSmokeColor(String smokeColor) {
        this.smokeColor = smokeColor;
    }

    public String getWasteType() {
        return wasteType;
    }

    public void setWasteType(String wasteType) {
        this.wasteType = wasteType;
    }

    public String getAiSeverityLabel() {
        return aiSeverityLabel;
    }

    public void setAiSeverityLabel(String aiSeverityLabel) {
        this.aiSeverityLabel = aiSeverityLabel;
    }

    public String getAiPriority() {
        return aiPriority;
    }

    public void setAiPriority(String aiPriority) {
        this.aiPriority = aiPriority;
    }

    public Double getAiScore() {
        return aiScore;
    }

    public void setAiScore(Double aiScore) {
        this.aiScore = aiScore;
    }

    public Double getMediaDurationSeconds() {
        return mediaDurationSeconds;
    }

    public void setMediaDurationSeconds(Double mediaDurationSeconds) {
        this.mediaDurationSeconds = mediaDurationSeconds;
    }

    public Double getAiConfidenceScore() {
        return aiConfidenceScore;
    }

    public void setAiConfidenceScore(Double aiConfidenceScore) {
        this.aiConfidenceScore = aiConfidenceScore;
    }

    public Double getRollingAverageScore() {
        return rollingAverageScore;
    }

    public void setRollingAverageScore(Double rollingAverageScore) {
        this.rollingAverageScore = rollingAverageScore;
    }

    public Double getEstimatedCarbonGrams() {
        return estimatedCarbonGrams;
    }

    public void setEstimatedCarbonGrams(Double estimatedCarbonGrams) {
        this.estimatedCarbonGrams = estimatedCarbonGrams;
    }

    public String getCarbonEstimateLabel() {
        return carbonEstimateLabel;
    }

    public void setCarbonEstimateLabel(String carbonEstimateLabel) {
        this.carbonEstimateLabel = carbonEstimateLabel;
    }

    public String getCarbonEstimateMethod() {
        return carbonEstimateMethod;
    }

    public void setCarbonEstimateMethod(String carbonEstimateMethod) {
        this.carbonEstimateMethod = carbonEstimateMethod;
    }

    public Integer getVehicleCount() {
        return vehicleCount;
    }

    public void setVehicleCount(Integer vehicleCount) {
        this.vehicleCount = vehicleCount;
    }

    public Integer getFrameSampleCount() {
        return frameSampleCount;
    }

    public void setFrameSampleCount(Integer frameSampleCount) {
        this.frameSampleCount = frameSampleCount;
    }

    public String getVehiclePlateNumber() {
        return vehiclePlateNumber;
    }

    public void setVehiclePlateNumber(String vehiclePlateNumber) {
        this.vehiclePlateNumber = vehiclePlateNumber;
    }

    public String getAiSummary() {
        return aiSummary;
    }

    public void setAiSummary(String aiSummary) {
        this.aiSummary = aiSummary;
    }

    public String getEvidenceImageUrl() {
        return evidenceImageUrl;
    }

    public void setEvidenceImageUrl(String evidenceImageUrl) {
        this.evidenceImageUrl = evidenceImageUrl;
    }
}
