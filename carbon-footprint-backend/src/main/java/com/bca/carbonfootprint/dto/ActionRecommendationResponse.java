package com.bca.carbonfootprint.dto;

public class ActionRecommendationResponse {

    private String activityType;
    private String title;
    private String description;
    private double estimatedMonthlySaving;
    private String effort;
    private String priority;

    public ActionRecommendationResponse(
            String activityType,
            String title,
            String description,
            double estimatedMonthlySaving,
            String effort,
            String priority) {
        this.activityType = activityType;
        this.title = title;
        this.description = description;
        this.estimatedMonthlySaving = estimatedMonthlySaving;
        this.effort = effort;
        this.priority = priority;
    }

    public String getActivityType() {
        return activityType;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public double getEstimatedMonthlySaving() {
        return estimatedMonthlySaving;
    }

    public String getEffort() {
        return effort;
    }

    public String getPriority() {
        return priority;
    }
}
