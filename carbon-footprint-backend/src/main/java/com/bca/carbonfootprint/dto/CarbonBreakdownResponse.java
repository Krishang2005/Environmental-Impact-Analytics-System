package com.bca.carbonfootprint.dto;

public class CarbonBreakdownResponse {

    private String activityType;
    private double carbonAmount;

    public CarbonBreakdownResponse() {
    }

    public CarbonBreakdownResponse(String activityType, double carbonAmount) {
        this.activityType = activityType;
        this.carbonAmount = carbonAmount;
    }

    public String getActivityType() {
        return activityType;
    }

    public double getCarbonAmount() {
        return carbonAmount;
    }
}
