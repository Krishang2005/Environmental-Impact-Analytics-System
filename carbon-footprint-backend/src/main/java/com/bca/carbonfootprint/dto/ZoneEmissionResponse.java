package com.bca.carbonfootprint.dto;

public class ZoneEmissionResponse {

    private Long zoneId;
    private String zoneName;
    private Double totalEmission;
    private Double averageEmission;
    private Long totalUsers;

    public ZoneEmissionResponse() {}

    public ZoneEmissionResponse(Long zoneId,
                                String zoneName,
                                Double totalEmission,
                                Double averageEmission) {
        this.zoneId = zoneId;
        this.zoneName = zoneName;
        this.totalEmission = totalEmission;
        this.averageEmission = averageEmission;
    }

    public Long getZoneId() {
        return zoneId;
    }

    public void setZoneId(Long zoneId) {
        this.zoneId = zoneId;
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

    public Double getAverageEmission() {
        return averageEmission;
    }

    public void setAverageEmission(Double averageEmission) {
        this.averageEmission = averageEmission;
    }

    public Long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(Long totalUsers) {
        this.totalUsers = totalUsers;
    }
}