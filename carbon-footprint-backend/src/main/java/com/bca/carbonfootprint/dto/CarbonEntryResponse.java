package com.bca.carbonfootprint.dto;

import java.time.LocalDate;

public class CarbonEntryResponse {

    private Long id;
    private String activityType;
    private double quantity;
    private double carbonAmount;
    private LocalDate date;

    public CarbonEntryResponse() {
    }

    public CarbonEntryResponse(Long id,
                               String activityType,
                               double quantity,
                               double carbonAmount,
                               LocalDate date) {
        this.id = id;
        this.activityType = activityType;
        this.quantity = quantity;
        this.carbonAmount = carbonAmount;
        this.date = date;
    }

    public Long getId() {
        return id;
    }

    public String getActivityType() {
        return activityType;
    }

    public double getQuantity() {
        return quantity;
    }

    public double getCarbonAmount() {
        return carbonAmount;
    }

    public LocalDate getDate() {
        return date;
    }
}
