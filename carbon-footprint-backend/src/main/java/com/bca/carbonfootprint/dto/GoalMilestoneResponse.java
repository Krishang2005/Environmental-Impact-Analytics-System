package com.bca.carbonfootprint.dto;

public class GoalMilestoneResponse {

    private String code;
    private String title;
    private String description;
    private double targetValue;
    private double currentValue;
    private double progressPct;
    private boolean unlocked;

    public GoalMilestoneResponse(
            String code,
            String title,
            String description,
            double targetValue,
            double currentValue,
            double progressPct,
            boolean unlocked
    ) {
        this.code = code;
        this.title = title;
        this.description = description;
        this.targetValue = targetValue;
        this.currentValue = currentValue;
        this.progressPct = progressPct;
        this.unlocked = unlocked;
    }

    public String getCode() {
        return code;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public double getTargetValue() {
        return targetValue;
    }

    public double getCurrentValue() {
        return currentValue;
    }

    public double getProgressPct() {
        return progressPct;
    }

    public boolean isUnlocked() {
        return unlocked;
    }
}
