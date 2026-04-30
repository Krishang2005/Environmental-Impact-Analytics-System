package com.bca.carbonfootprint.dto;

public class ZoneSummaryDTO {

    private Long zoneId;
    private String zoneName;
    private Long totalUsers;

    public ZoneSummaryDTO(Long zoneId, String zoneName, Long totalUsers) {
        this.zoneId = zoneId;
        this.zoneName = zoneName;
        this.totalUsers = totalUsers;
    }

    public Long getZoneId() {
        return zoneId;
    }

    public String getZoneName() {
        return zoneName;
    }

    public Long getTotalUsers() {
        return totalUsers;
    }
}