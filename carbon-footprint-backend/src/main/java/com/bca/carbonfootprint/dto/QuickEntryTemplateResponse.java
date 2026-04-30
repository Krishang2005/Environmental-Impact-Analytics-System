package com.bca.carbonfootprint.dto;

import java.time.LocalDateTime;

public class QuickEntryTemplateResponse {

    private Long id;
    private String name;
    private String activityType;
    private double quantity;
    private int useCount;
    private LocalDateTime createdAt;
    private LocalDateTime lastUsedAt;

    public QuickEntryTemplateResponse(
            Long id,
            String name,
            String activityType,
            double quantity,
            int useCount,
            LocalDateTime createdAt,
            LocalDateTime lastUsedAt
    ) {
        this.id = id;
        this.name = name;
        this.activityType = activityType;
        this.quantity = quantity;
        this.useCount = useCount;
        this.createdAt = createdAt;
        this.lastUsedAt = lastUsedAt;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getActivityType() {
        return activityType;
    }

    public double getQuantity() {
        return quantity;
    }

    public int getUseCount() {
        return useCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getLastUsedAt() {
        return lastUsedAt;
    }
}
