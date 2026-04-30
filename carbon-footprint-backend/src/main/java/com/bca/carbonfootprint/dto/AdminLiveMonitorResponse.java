package com.bca.carbonfootprint.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AdminLiveMonitorResponse {

    private long activeUsersNow;
    private long entriesLastHour;
    private double emissionChangeVsYesterdayPct;
    private int zonesExceededThresholdToday;
    private LocalDateTime updatedAt;
    private List<AdminLiveFeedItemResponse> activityFeed;

    public AdminLiveMonitorResponse(
            long activeUsersNow,
            long entriesLastHour,
            double emissionChangeVsYesterdayPct,
            int zonesExceededThresholdToday,
            LocalDateTime updatedAt,
            List<AdminLiveFeedItemResponse> activityFeed
    ) {
        this.activeUsersNow = activeUsersNow;
        this.entriesLastHour = entriesLastHour;
        this.emissionChangeVsYesterdayPct = emissionChangeVsYesterdayPct;
        this.zonesExceededThresholdToday = zonesExceededThresholdToday;
        this.updatedAt = updatedAt;
        this.activityFeed = activityFeed;
    }

    public long getActiveUsersNow() {
        return activeUsersNow;
    }

    public long getEntriesLastHour() {
        return entriesLastHour;
    }

    public double getEmissionChangeVsYesterdayPct() {
        return emissionChangeVsYesterdayPct;
    }

    public int getZonesExceededThresholdToday() {
        return zonesExceededThresholdToday;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<AdminLiveFeedItemResponse> getActivityFeed() {
        return activityFeed;
    }
}
