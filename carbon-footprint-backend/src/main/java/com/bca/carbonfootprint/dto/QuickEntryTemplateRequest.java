package com.bca.carbonfootprint.dto;

import com.bca.carbonfootprint.model.ActivityType;

public class QuickEntryTemplateRequest {

    private String name;
    private ActivityType activityType;
    private double quantity;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ActivityType getActivityType() {
        return activityType;
    }

    public void setActivityType(ActivityType activityType) {
        this.activityType = activityType;
    }

    public double getQuantity() {
        return quantity;
    }

    public void setQuantity(double quantity) {
        this.quantity = quantity;
    }
}
