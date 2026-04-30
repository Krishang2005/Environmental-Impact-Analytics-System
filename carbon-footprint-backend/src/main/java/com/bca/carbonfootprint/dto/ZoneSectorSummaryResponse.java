package com.bca.carbonfootprint.dto;

public class ZoneSectorSummaryResponse {

    private String zoneName;
    private String sectorCategory;
    private String sectorType;
    private Long userCount;

    // ✅ Default constructor
    public ZoneSectorSummaryResponse() {
    }

    // ✅ Required constructor
    public ZoneSectorSummaryResponse(String zoneName,
                                     String sectorCategory,
                                     String sectorType,
                                     Long userCount) {
        this.zoneName = zoneName;
        this.sectorCategory = sectorCategory;
        this.sectorType = sectorType;
        this.userCount = userCount;
    }

    // Getters & Setters

    public String getZoneName() {
        return zoneName;
    }

    public void setZoneName(String zoneName) {
        this.zoneName = zoneName;
    }

    public String getSectorCategory() {
        return sectorCategory;
    }

    public void setSectorCategory(String sectorCategory) {
        this.sectorCategory = sectorCategory;
    }

    public String getSectorType() {
        return sectorType;
    }

    public void setSectorType(String sectorType) {
        this.sectorType = sectorType;
    }

    public Long getUserCount() {
        return userCount;
    }

    public void setUserCount(Long userCount) {
        this.userCount = userCount;
    }
}