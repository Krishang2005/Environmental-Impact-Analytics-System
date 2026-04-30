package com.bca.carbonfootprint.dto;

import java.time.LocalDateTime;

public class RewardEventResponse {

    private String source;
    private int points;
    private String description;
    private LocalDateTime createdAt;

    public RewardEventResponse(String source, int points, String description, LocalDateTime createdAt) {
        this.source = source;
        this.points = points;
        this.description = description;
        this.createdAt = createdAt;
    }

    public String getSource() {
        return source;
    }

    public int getPoints() {
        return points;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
