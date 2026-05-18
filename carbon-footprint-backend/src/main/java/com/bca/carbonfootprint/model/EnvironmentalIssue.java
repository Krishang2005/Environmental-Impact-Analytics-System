package com.bca.carbonfootprint.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "environmental_issue")
public class EnvironmentalIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1200)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueType issueType;

    @Column(nullable = false)
    private int severity;

    private Double latitude;
    private Double longitude;
    private String address;
    private String mappedZoneName;

    private LocalDateTime captureTimestamp;

    @Column(length = 40)
    private String mediaType;

    @Column(length = 120)
    private String detectionModel;

    private Boolean onDeviceInference;

    @Column(length = 40)
    private String smokeColor;

    @Column(length = 40)
    private String wasteType;

    @Column(length = 40)
    private String aiSeverityLabel;

    @Column(length = 40)
    private String aiPriority;

    private Double mediaDurationSeconds;
    private Double aiScore;
    private Double aiConfidenceScore;
    private Double rollingAverageScore;
    private Double estimatedCarbonGrams;

    @Column(length = 80)
    private String carbonEstimateLabel;

    @Column(length = 240)
    private String carbonEstimateMethod;

    private Integer vehicleCount;
    private Integer frameSampleCount;

    @Column(length = 40)
    private String vehiclePlateNumber;

    @Column(length = 1600)
    private String aiSummary;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 40)
    private IssueStatus status;

    @Column(nullable = false)
    private LocalDateTime reportedAt;

    private LocalDateTime resolvedAt;
    private String proofImageUrl;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String evidenceImageUrl;

    @Column(length = 800)
    private String resolutionNote;

    @ManyToOne
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    public Long getId() {
        return id;
    }

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

    public int getSeverity() {
        return severity;
    }

    public void setSeverity(int severity) {
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

    public IssueStatus getStatus() {
        return status;
    }

    public void setStatus(IssueStatus status) {
        this.status = status;
    }

    public LocalDateTime getReportedAt() {
        return reportedAt;
    }

    public void setReportedAt(LocalDateTime reportedAt) {
        this.reportedAt = reportedAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public String getProofImageUrl() {
        return proofImageUrl;
    }

    public void setProofImageUrl(String proofImageUrl) {
        this.proofImageUrl = proofImageUrl;
    }

    public String getEvidenceImageUrl() {
        return evidenceImageUrl;
    }

    public void setEvidenceImageUrl(String evidenceImageUrl) {
        this.evidenceImageUrl = evidenceImageUrl;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public void setResolutionNote(String resolutionNote) {
        this.resolutionNote = resolutionNote;
    }

    public User getReporter() {
        return reporter;
    }

    public void setReporter(User reporter) {
        this.reporter = reporter;
    }
}
