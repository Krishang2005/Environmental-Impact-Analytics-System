package com.bca.carbonfootprint.dto;

public class ZoneCompetitionEntryResponse {

    private int rank;
    private Long zoneId;
    private String zoneName;
    private long activeUsersToday;
    private boolean currentZone;

    public ZoneCompetitionEntryResponse(int rank, Long zoneId, String zoneName, long activeUsersToday, boolean currentZone) {
        this.rank = rank;
        this.zoneId = zoneId;
        this.zoneName = zoneName;
        this.activeUsersToday = activeUsersToday;
        this.currentZone = currentZone;
    }

    public int getRank() {
        return rank;
    }

    public Long getZoneId() {
        return zoneId;
    }

    public String getZoneName() {
        return zoneName;
    }

    public long getActiveUsersToday() {
        return activeUsersToday;
    }

    public boolean isCurrentZone() {
        return currentZone;
    }
}
