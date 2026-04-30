package com.bca.carbonfootprint.dto;

public class AdminUserStreakResponse {

    private Long userId;
    private String userName;
    private String email;
    private String zoneName;
    private int currentStreak;
    private int longestStreak;
    private int totalCheckIns;
    private int freezeCredits;
    private int perfectGreenDays;
    private int rewardPoints;
    private int weeklyBoxesAvailable;
    private int nextMilestone;
    private int daysToNextMilestone;
    private Integer customMilestoneTargetDays;

    public AdminUserStreakResponse(
            Long userId,
            String userName,
            String email,
            String zoneName,
            int currentStreak,
            int longestStreak,
            int totalCheckIns,
            int freezeCredits,
            int perfectGreenDays,
            int rewardPoints,
            int weeklyBoxesAvailable,
            int nextMilestone,
            int daysToNextMilestone,
            Integer customMilestoneTargetDays
    ) {
        this.userId = userId;
        this.userName = userName;
        this.email = email;
        this.zoneName = zoneName;
        this.currentStreak = currentStreak;
        this.longestStreak = longestStreak;
        this.totalCheckIns = totalCheckIns;
        this.freezeCredits = freezeCredits;
        this.perfectGreenDays = perfectGreenDays;
        this.rewardPoints = rewardPoints;
        this.weeklyBoxesAvailable = weeklyBoxesAvailable;
        this.nextMilestone = nextMilestone;
        this.daysToNextMilestone = daysToNextMilestone;
        this.customMilestoneTargetDays = customMilestoneTargetDays;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public String getEmail() {
        return email;
    }

    public String getZoneName() {
        return zoneName;
    }

    public int getCurrentStreak() {
        return currentStreak;
    }

    public int getLongestStreak() {
        return longestStreak;
    }

    public int getTotalCheckIns() {
        return totalCheckIns;
    }

    public int getFreezeCredits() {
        return freezeCredits;
    }

    public int getPerfectGreenDays() {
        return perfectGreenDays;
    }

    public int getRewardPoints() {
        return rewardPoints;
    }

    public int getWeeklyBoxesAvailable() {
        return weeklyBoxesAvailable;
    }

    public int getNextMilestone() {
        return nextMilestone;
    }

    public int getDaysToNextMilestone() {
        return daysToNextMilestone;
    }

    public Integer getCustomMilestoneTargetDays() {
        return customMilestoneTargetDays;
    }
}
