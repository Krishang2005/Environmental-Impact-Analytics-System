package com.bca.carbonfootprint.dto;

import java.time.LocalDateTime;

public class AdminLiveFeedItemResponse {

    private String id;
    private String type;
    private String severity;
    private String message;
    private LocalDateTime createdAt;

    public AdminLiveFeedItemResponse(
            String id,
            String type,
            String severity,
            String message,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.type = type;
        this.severity = severity;
        this.message = message;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public String getSeverity() {
        return severity;
    }

    public String getMessage() {
        return message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
