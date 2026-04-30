package com.bca.carbonfootprint.dto;

public class ZoneLeaderboardEntryResponse {

    private int rank;
    private Long userId;
    private String name;
    private double monthlyEmission;
    private int rewardPoints;
    private boolean currentUser;

    public ZoneLeaderboardEntryResponse(
            int rank,
            Long userId,
            String name,
            double monthlyEmission,
            int rewardPoints,
            boolean currentUser
    ) {
        this.rank = rank;
        this.userId = userId;
        this.name = name;
        this.monthlyEmission = monthlyEmission;
        this.rewardPoints = rewardPoints;
        this.currentUser = currentUser;
    }

    public int getRank() {
        return rank;
    }

    public Long getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public double getMonthlyEmission() {
        return monthlyEmission;
    }

    public int getRewardPoints() {
        return rewardPoints;
    }

    public boolean isCurrentUser() {
        return currentUser;
    }
}
