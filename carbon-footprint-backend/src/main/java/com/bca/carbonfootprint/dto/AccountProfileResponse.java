package com.bca.carbonfootprint.dto;

public class AccountProfileResponse {

    private final Long id;
    private final String name;
    private final String email;
    private final String role;
    private final String sectorCategory;
    private final String sectorType;
    private final String address;
    private final Double latitude;
    private final Double longitude;
    private final String zoneName;

    public AccountProfileResponse(
            Long id,
            String name,
            String email,
            String role,
            String sectorCategory,
            String sectorType,
            String address,
            Double latitude,
            Double longitude,
            String zoneName
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.sectorCategory = sectorCategory;
        this.sectorType = sectorType;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.zoneName = zoneName;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public String getSectorCategory() {
        return sectorCategory;
    }

    public String getSectorType() {
        return sectorType;
    }

    public String getAddress() {
        return address;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public String getZoneName() {
        return zoneName;
    }
}
