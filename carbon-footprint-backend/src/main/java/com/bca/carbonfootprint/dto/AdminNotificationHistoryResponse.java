package com.bca.carbonfootprint.dto;

import java.time.LocalDateTime;

public class AdminNotificationHistoryResponse {

    private Long id;
    private String actionType;
    private String description;
    private String actorEmail;
    private LocalDateTime createdAt;

    public AdminNotificationHistoryResponse(
            Long id,
            String actionType,
            String description,
            String actorEmail,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.actionType = actionType;
        this.description = description;
        this.actorEmail = actorEmail;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getActionType() {
        return actionType;
    }

    public String getDescription() {
        return description;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
