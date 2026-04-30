package com.bca.carbonfootprint.dto;

public class AdminUserProfileResponse {

    private Long id;
    private String name;
    private String email;
    private Double todayEmission;
    private Double monthlyEmission;
    private Double latitude;
    private Double longitude;

    public AdminUserProfileResponse(
            Long id,
            String name,
            String email,
            Double todayEmission,
            Double monthlyEmission,
            Double latitude,
            Double longitude) {

        this.id = id;
        this.name = name;
        this.email = email;
        this.todayEmission = todayEmission;
        this.monthlyEmission = monthlyEmission;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public Double getTodayEmission() { return todayEmission; }
    public Double getMonthlyEmission() { return monthlyEmission; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
}