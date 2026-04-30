package com.bca.carbonfootprint.dto;

import java.time.LocalDateTime;

public class AdminNotificationDispatchResponse {

    private String status;
    private String targetType;
    private int recipients;
    private String title;
    private String message;
    private String severity;
    private LocalDateTime createdAt;
    private String actorEmail;

    public AdminNotificationDispatchResponse(
            String status,
            String targetType,
            int recipients,
            String title,
            String message,
            String severity,
            LocalDateTime createdAt,
            String actorEmail
    ) {
        this.status = status;
        this.targetType = targetType;
        this.recipients = recipients;
        this.title = title;
        this.message = message;
        this.severity = severity;
        this.createdAt = createdAt;
        this.actorEmail = actorEmail;
    }

    public String getStatus() {
        return status;
    }

    public String getTargetType() {
        return targetType;
    }

    public int getRecipients() {
        return recipients;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getSeverity() {
        return severity;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getActorEmail() {
        return actorEmail;
    }
}
