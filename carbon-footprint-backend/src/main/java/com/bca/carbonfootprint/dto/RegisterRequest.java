package com.bca.carbonfootprint.dto;

public class RegisterRequest {

    private String name;
    private String email;
    private String password;
    private String address;
    private Double latitude;
    private Double longitude;

    private String sectorCategory;
    private String sectorType;

    // Getters & Setters

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getSectorCategory() { return sectorCategory; }
    public void setSectorCategory(String sectorCategory) {
        this.sectorCategory = sectorCategory;
    }

    public String getSectorType() { return sectorType; }
    public void setSectorType(String sectorType) {
        this.sectorType = sectorType;
    }
}