package com.bca.carbonfootprint.dto;

import java.time.LocalDateTime;

public class IssueTimelineItemResponse {

    private String previousStatus;
    private String newStatus;
    private String note;
    private String proofImageUrl;
    private LocalDateTime changedAt;
    private String changedBy;

    public IssueTimelineItemResponse(
            String previousStatus,
            String newStatus,
            String note,
            String proofImageUrl,
            LocalDateTime changedAt,
            String changedBy
    ) {
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.note = note;
        this.proofImageUrl = proofImageUrl;
        this.changedAt = changedAt;
        this.changedBy = changedBy;
    }

    public String getPreviousStatus() {
        return previousStatus;
    }

    public String getNewStatus() {
        return newStatus;
    }

    public String getNote() {
        return note;
    }

    public String getProofImageUrl() {
        return proofImageUrl;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }

    public String getChangedBy() {
        return changedBy;
    }
}
