package com.bca.carbonfootprint.dto;

import com.bca.carbonfootprint.model.ActivityType;

public class CarbonEntryRequest {

    private ActivityType activityType;
    private double quantity;

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