package com.bca.carbonfootprint.dto;

public class ZoneUserResponse {

    private Long id;
    private String name;
    private String email;   // ✅ ADD THIS
    private String address;
    private String category;
    private String sectorType;
    private double todayEmission;
    private double monthlyEmission;
    private double latitude;
    private double longitude;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    // ✅ NEW
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSectorType() {
        return sectorType;
    }

    public void setSectorType(String sectorType) {
        this.sectorType = sectorType;
    }

    public double getTodayEmission() {
        return todayEmission;
    }

    public void setTodayEmission(double todayEmission) {
        this.todayEmission = todayEmission;
    }

    public double getMonthlyEmission() {
        return monthlyEmission;
    }

    public void setMonthlyEmission(double monthlyEmission) {
        this.monthlyEmission = monthlyEmission;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }
}