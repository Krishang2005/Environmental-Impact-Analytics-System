package com.bca.carbonfootprint.dto;

import java.util.List;

public class RewardSummaryResponse {

    private int totalPoints;
    private List<RewardEventResponse> recentEvents;

    public RewardSummaryResponse(int totalPoints, List<RewardEventResponse> recentEvents) {
        this.totalPoints = totalPoints;
        this.recentEvents = recentEvents;
    }

    public int getTotalPoints() {
        return totalPoints;
    }

    public List<RewardEventResponse> getRecentEvents() {
        return recentEvents;
    }
}
