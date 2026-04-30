package com.bca.carbonfootprint.dto;

import java.util.List;

public class ZoneLeaderboardResponse {

    private String zoneName;
    private int month;
    private int year;
    private String winnerName;
    private double winnerEmission;
    private List<ZoneLeaderboardEntryResponse> entries;

    public ZoneLeaderboardResponse(
            String zoneName,
            int month,
            int year,
            String winnerName,
            double winnerEmission,
            List<ZoneLeaderboardEntryResponse> entries
    ) {
        this.zoneName = zoneName;
        this.month = month;
        this.year = year;
        this.winnerName = winnerName;
        this.winnerEmission = winnerEmission;
        this.entries = entries;
    }

    public String getZoneName() {
        return zoneName;
    }

    public int getMonth() {
        return month;
    }

    public int getYear() {
        return year;
    }

    public String getWinnerName() {
        return winnerName;
    }

    public double getWinnerEmission() {
        return winnerEmission;
    }

    public List<ZoneLeaderboardEntryResponse> getEntries() {
        return entries;
    }
}
