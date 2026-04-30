package com.bca.carbonfootprint.dto;

import java.util.List;

public class StreakOverviewResponse {

    private int currentStreak;
    private int longestStreak;
    private int totalCheckIns;
    private int freezeCredits;
    private int perfectGreenDays;
    private int rewardPoints;
    private boolean checkedInToday;
    private boolean todayPerfectGreenDay;
    private boolean weeklyRewardReady;
    private int weeklyBoxesAvailable;
    private String unlockedDailyTip;
    private String reminderMessage;
    private String actionMessage;
    private boolean freezeUsedToday;
    private int pointsEarnedToday;
    private int nextMilestone;
    private int daysToNextMilestone;
    private String growthStage;
    private int growthProgressPct;
    private String zoneName;
    private long zoneActiveUsersToday;
    private long zoneTotalUsers;
    private int zoneActiveDayStreak;
    private List<StreakCalendarDayResponse> recentCalendar;
    private List<ZoneCompetitionEntryResponse> zoneCompetition;

    public StreakOverviewResponse(
            int currentStreak,
            int longestStreak,
            int totalCheckIns,
            int freezeCredits,
            int perfectGreenDays,
            int rewardPoints,
            boolean checkedInToday,
            boolean todayPerfectGreenDay,
            boolean weeklyRewardReady,
            int weeklyBoxesAvailable,
            String unlockedDailyTip,
            String reminderMessage,
            String actionMessage,
            boolean freezeUsedToday,
            int pointsEarnedToday,
            int nextMilestone,
            int daysToNextMilestone,
            String growthStage,
            int growthProgressPct,
            String zoneName,
            long zoneActiveUsersToday,
            long zoneTotalUsers,
            int zoneActiveDayStreak,
            List<StreakCalendarDayResponse> recentCalendar,
            List<ZoneCompetitionEntryResponse> zoneCompetition
    ) {
        this.currentStreak = currentStreak;
        this.longestStreak = longestStreak;
        this.totalCheckIns = totalCheckIns;
        this.freezeCredits = freezeCredits;
        this.perfectGreenDays = perfectGreenDays;
        this.rewardPoints = rewardPoints;
        this.checkedInToday = checkedInToday;
        this.todayPerfectGreenDay = todayPerfectGreenDay;
        this.weeklyRewardReady = weeklyRewardReady;
        this.weeklyBoxesAvailable = weeklyBoxesAvailable;
        this.unlockedDailyTip = unlockedDailyTip;
        this.reminderMessage = reminderMessage;
        this.actionMessage = actionMessage;
        this.freezeUsedToday = freezeUsedToday;
        this.pointsEarnedToday = pointsEarnedToday;
        this.nextMilestone = nextMilestone;
        this.daysToNextMilestone = daysToNextMilestone;
        this.growthStage = growthStage;
        this.growthProgressPct = growthProgressPct;
        this.zoneName = zoneName;
        this.zoneActiveUsersToday = zoneActiveUsersToday;
        this.zoneTotalUsers = zoneTotalUsers;
        this.zoneActiveDayStreak = zoneActiveDayStreak;
        this.recentCalendar = recentCalendar;
        this.zoneCompetition = zoneCompetition;
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

    public boolean isCheckedInToday() {
        return checkedInToday;
    }

    public boolean isTodayPerfectGreenDay() {
        return todayPerfectGreenDay;
    }

    public boolean isWeeklyRewardReady() {
        return weeklyRewardReady;
    }

    public int getWeeklyBoxesAvailable() {
        return weeklyBoxesAvailable;
    }

    public String getUnlockedDailyTip() {
        return unlockedDailyTip;
    }

    public String getReminderMessage() {
        return reminderMessage;
    }

    public String getActionMessage() {
        return actionMessage;
    }

    public boolean isFreezeUsedToday() {
        return freezeUsedToday;
    }

    public int getPointsEarnedToday() {
        return pointsEarnedToday;
    }

    public int getNextMilestone() {
        return nextMilestone;
    }

    public int getDaysToNextMilestone() {
        return daysToNextMilestone;
    }

    public String getGrowthStage() {
        return growthStage;
    }

    public int getGrowthProgressPct() {
        return growthProgressPct;
    }

    public String getZoneName() {
        return zoneName;
    }

    public long getZoneActiveUsersToday() {
        return zoneActiveUsersToday;
    }

    public long getZoneTotalUsers() {
        return zoneTotalUsers;
    }

    public int getZoneActiveDayStreak() {
        return zoneActiveDayStreak;
    }

    public List<StreakCalendarDayResponse> getRecentCalendar() {
        return recentCalendar;
    }

    public List<ZoneCompetitionEntryResponse> getZoneCompetition() {
        return zoneCompetition;
    }
}
