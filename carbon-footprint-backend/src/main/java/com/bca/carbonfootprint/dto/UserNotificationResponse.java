package com.bca.carbonfootprint.dto;

import java.time.LocalDateTime;

public class UserNotificationResponse {

    private Long id;
    private String title;
    private String message;
    private String type;
    private String severity;
    private boolean readStatus;
    private LocalDateTime createdAt;

    public UserNotificationResponse(
            Long id,
            String title,
            String message,
            String type,
            String severity,
            boolean readStatus,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.type = type;
        this.severity = severity;
        this.readStatus = readStatus;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getType() {
        return type;
    }

    public String getSeverity() {
        return severity;
    }

    public boolean isReadStatus() {
        return readStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
