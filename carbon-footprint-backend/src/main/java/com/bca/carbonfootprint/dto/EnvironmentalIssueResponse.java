package com.bca.carbonfootprint.dto;

import java.time.LocalDateTime;
import java.util.List;

public class EnvironmentalIssueResponse {

    private Long id;
    private String title;
    private String description;
    private String issueType;
    private int severity;
    private Double latitude;
    private Double longitude;
    private String address;
    private String mappedZoneName;
    private String status;
    private LocalDateTime reportedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime captureTimestamp;
    private String reporterName;
    private String zoneName;
    private int upvoteCount;
    private int followerCount;
    private boolean upvotedByMe;
    private boolean followedByMe;
    private String evidenceImageUrl;
    private String proofImageUrl;
    private String resolutionNote;
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
    private List<IssueTimelineItemResponse> timeline;

    public EnvironmentalIssueResponse(
            Long id,
            String title,
            String description,
            String issueType,
            int severity,
            Double latitude,
            Double longitude,
            String address,
            String mappedZoneName,
            String status,
            LocalDateTime reportedAt,
            LocalDateTime resolvedAt,
            LocalDateTime captureTimestamp,
            String reporterName,
            String zoneName,
            int upvoteCount,
            int followerCount,
            boolean upvotedByMe,
            boolean followedByMe,
            String evidenceImageUrl,
            String proofImageUrl,
            String resolutionNote,
            String mediaType,
            String detectionModel,
            Boolean onDeviceInference,
            String smokeColor,
            String wasteType,
            String aiSeverityLabel,
            String aiPriority,
            Double mediaDurationSeconds,
            Double aiScore,
            Double aiConfidenceScore,
            Double rollingAverageScore,
            Double estimatedCarbonGrams,
            String carbonEstimateLabel,
            String carbonEstimateMethod,
            Integer vehicleCount,
            Integer frameSampleCount,
            String vehiclePlateNumber,
            String aiSummary,
            List<IssueTimelineItemResponse> timeline) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.issueType = issueType;
        this.severity = severity;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.mappedZoneName = mappedZoneName;
        this.status = status;
        this.reportedAt = reportedAt;
        this.resolvedAt = resolvedAt;
        this.captureTimestamp = captureTimestamp;
        this.reporterName = reporterName;
        this.zoneName = zoneName;
        this.upvoteCount = upvoteCount;
        this.followerCount = followerCount;
        this.upvotedByMe = upvotedByMe;
        this.followedByMe = followedByMe;
        this.evidenceImageUrl = evidenceImageUrl;
        this.proofImageUrl = proofImageUrl;
        this.resolutionNote = resolutionNote;
        this.mediaType = mediaType;
        this.detectionModel = detectionModel;
        this.onDeviceInference = onDeviceInference;
        this.smokeColor = smokeColor;
        this.wasteType = wasteType;
        this.aiSeverityLabel = aiSeverityLabel;
        this.aiPriority = aiPriority;
        this.mediaDurationSeconds = mediaDurationSeconds;
        this.aiScore = aiScore;
        this.aiConfidenceScore = aiConfidenceScore;
        this.rollingAverageScore = rollingAverageScore;
        this.estimatedCarbonGrams = estimatedCarbonGrams;
        this.carbonEstimateLabel = carbonEstimateLabel;
        this.carbonEstimateMethod = carbonEstimateMethod;
        this.vehicleCount = vehicleCount;
        this.frameSampleCount = frameSampleCount;
        this.vehiclePlateNumber = vehiclePlateNumber;
        this.aiSummary = aiSummary;
        this.timeline = timeline;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getIssueType() {
        return issueType;
    }

    public int getSeverity() {
        return severity;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public String getAddress() {
        return address;
    }

    public String getMappedZoneName() {
        return mappedZoneName;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getReportedAt() {
        return reportedAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public LocalDateTime getCaptureTimestamp() {
        return captureTimestamp;
    }

    public String getReporterName() {
        return reporterName;
    }

    public String getZoneName() {
        return zoneName;
    }

    public int getUpvoteCount() {
        return upvoteCount;
    }

    public int getFollowerCount() {
        return followerCount;
    }

    public boolean isUpvotedByMe() {
        return upvotedByMe;
    }

    public boolean isFollowedByMe() {
        return followedByMe;
    }

    public String getEvidenceImageUrl() {
        return evidenceImageUrl;
    }

    public String getProofImageUrl() {
        return proofImageUrl;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public String getMediaType() {
        return mediaType;
    }

    public String getDetectionModel() {
        return detectionModel;
    }

    public Boolean getOnDeviceInference() {
        return onDeviceInference;
    }

    public String getSmokeColor() {
        return smokeColor;
    }

    public String getWasteType() {
        return wasteType;
    }

    public String getAiSeverityLabel() {
        return aiSeverityLabel;
    }

    public String getAiPriority() {
        return aiPriority;
    }

    public Double getAiScore() {
        return aiScore;
    }

    public Double getMediaDurationSeconds() {
        return mediaDurationSeconds;
    }

    public Double getAiConfidenceScore() {
        return aiConfidenceScore;
    }

    public Double getRollingAverageScore() {
        return rollingAverageScore;
    }

    public Double getEstimatedCarbonGrams() {
        return estimatedCarbonGrams;
    }

    public String getCarbonEstimateLabel() {
        return carbonEstimateLabel;
    }

    public String getCarbonEstimateMethod() {
        return carbonEstimateMethod;
    }

    public Integer getVehicleCount() {
        return vehicleCount;
    }

    public Integer getFrameSampleCount() {
        return frameSampleCount;
    }

    public String getVehiclePlateNumber() {
        return vehiclePlateNumber;
    }

    public String getAiSummary() {
        return aiSummary;
    }

    public List<IssueTimelineItemResponse> getTimeline() {
        return timeline;
    }
}
