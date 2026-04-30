package com.bca.carbonfootprint.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class MissionResponse {

    private LocalDate weekStartDate;
    private String title;
    private String description;
    private String activityType;
    private double baselineQuantity;
    private double baselineEmission;
    private double targetQuantity;
    private double targetEmission;
    private double currentQuantity;
    private double currentEmission;
    private double progressPct;
    private boolean completed;
    private int rewardPoints;
    private boolean rewardGranted;
    private LocalDateTime completedAt;

    public MissionResponse(
            LocalDate weekStartDate,
            String title,
            String description,
            String activityType,
            double baselineQuantity,
            double baselineEmission,
            double targetQuantity,
            double targetEmission,
            double currentQuantity,
            double currentEmission,
            double progressPct,
            boolean completed,
            int rewardPoints,
            boolean rewardGranted,
            LocalDateTime completedAt
    ) {
        this.weekStartDate = weekStartDate;
        this.title = title;
        this.description = description;
        this.activityType = activityType;
        this.baselineQuantity = baselineQuantity;
        this.baselineEmission = baselineEmission;
        this.targetQuantity = targetQuantity;
        this.targetEmission = targetEmission;
        this.currentQuantity = currentQuantity;
        this.currentEmission = currentEmission;
        this.progressPct = progressPct;
        this.completed = completed;
        this.rewardPoints = rewardPoints;
        this.rewardGranted = rewardGranted;
        this.completedAt = completedAt;
    }

    public LocalDate getWeekStartDate() {
        return weekStartDate;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getActivityType() {
        return activityType;
    }

    public double getBaselineQuantity() {
        return baselineQuantity;
    }

    public double getBaselineEmission() {
        return baselineEmission;
    }

    public double getTargetQuantity() {
        return targetQuantity;
    }

    public double getTargetEmission() {
        return targetEmission;
    }

    public double getCurrentQuantity() {
        return currentQuantity;
    }

    public double getCurrentEmission() {
        return currentEmission;
    }

    public double getProgressPct() {
        return progressPct;
    }

    public boolean isCompleted() {
        return completed;
    }

    public int getRewardPoints() {
        return rewardPoints;
    }

    public boolean isRewardGranted() {
        return rewardGranted;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
}
