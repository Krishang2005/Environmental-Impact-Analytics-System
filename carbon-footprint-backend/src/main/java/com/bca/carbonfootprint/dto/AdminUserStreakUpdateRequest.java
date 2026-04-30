package com.bca.carbonfootprint.dto;

public class AdminUserStreakUpdateRequest {

    private Integer currentStreak;
    private Integer longestStreak;
    private Integer totalCheckIns;
    private Integer freezeCredits;
    private Integer perfectGreenDays;
    private Integer customMilestoneTargetDays;
    private Integer weeklyBoxesAvailable;
    private Integer bonusRewardPoints;
    private String bonusRewardDescription;

    public Integer getCurrentStreak() {
        return currentStreak;
    }

    public void setCurrentStreak(Integer currentStreak) {
        this.currentStreak = currentStreak;
    }

    public Integer getLongestStreak() {
        return longestStreak;
    }

    public void setLongestStreak(Integer longestStreak) {
        this.longestStreak = longestStreak;
    }

    public Integer getTotalCheckIns() {
        return totalCheckIns;
    }

    public void setTotalCheckIns(Integer totalCheckIns) {
        this.totalCheckIns = totalCheckIns;
    }

    public Integer getFreezeCredits() {
        return freezeCredits;
    }

    public void setFreezeCredits(Integer freezeCredits) {
        this.freezeCredits = freezeCredits;
    }

    public Integer getPerfectGreenDays() {
        return perfectGreenDays;
    }

    public void setPerfectGreenDays(Integer perfectGreenDays) {
        this.perfectGreenDays = perfectGreenDays;
    }

    public Integer getCustomMilestoneTargetDays() {
        return customMilestoneTargetDays;
    }

    public void setCustomMilestoneTargetDays(Integer customMilestoneTargetDays) {
        this.customMilestoneTargetDays = customMilestoneTargetDays;
    }

    public Integer getWeeklyBoxesAvailable() {
        return weeklyBoxesAvailable;
    }

    public void setWeeklyBoxesAvailable(Integer weeklyBoxesAvailable) {
        this.weeklyBoxesAvailable = weeklyBoxesAvailable;
    }

    public Integer getBonusRewardPoints() {
        return bonusRewardPoints;
    }

    public void setBonusRewardPoints(Integer bonusRewardPoints) {
        this.bonusRewardPoints = bonusRewardPoints;
    }

    public String getBonusRewardDescription() {
        return bonusRewardDescription;
    }

    public void setBonusRewardDescription(String bonusRewardDescription) {
        this.bonusRewardDescription = bonusRewardDescription;
    }
}
