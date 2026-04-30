package com.bca.carbonfootprint.dto;

public class HighEmitterResponse {

    private Long userId;
    private String name;
    private String email;
    private String zoneName;
    private Double totalEmission;
    private Double thresholdKg;
    private String alertStatus;

    // ✅ Default constructor (VERY IMPORTANT)
    public HighEmitterResponse() {
    }

    // ✅ Parameterized constructor
    public HighEmitterResponse(Long userId,
                               String name,
                               String email,
                               String zoneName,
                               Double totalEmission,
                               Double thresholdKg,
                               String alertStatus) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.zoneName = zoneName;
        this.totalEmission = totalEmission;
        this.thresholdKg = thresholdKg;
        this.alertStatus = alertStatus;
    }

    // Getters & Setters

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getZoneName() {
        return zoneName;
    }

    public void setZoneName(String zoneName) {
        this.zoneName = zoneName;
    }

    public Double getTotalEmission() {
        return totalEmission;
    }

    public void setTotalEmission(Double totalEmission) {
        this.totalEmission = totalEmission;
    }

    public Double getThresholdKg() {
        return thresholdKg;
    }

    public void setThresholdKg(Double thresholdKg) {
        this.thresholdKg = thresholdKg;
    }

    public String getAlertStatus() {
        return alertStatus;
    }

    public void setAlertStatus(String alertStatus) {
        this.alertStatus = alertStatus;
    }
}
