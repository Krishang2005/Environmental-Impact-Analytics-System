package com.bca.carbonfootprint.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_streak")
public class UserStreak {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private int currentStreak = 0;

    @Column(nullable = false)
    private int longestStreak = 0;

    @Column(nullable = false)
    private int totalCheckIns = 0;

    @Column(nullable = false)
    private int freezeCredits = 2;

    @Column(nullable = false)
    private int perfectGreenDays = 0;

    private LocalDate lastCheckInDate;

    private LocalDate lastTipUnlockedDate;

    @Column(length = 500)
    private String lastUnlockedTip;

    @Column(nullable = false)
    private int weeklyBoxesClaimedInCycle = 0;

    private Integer customMilestoneTargetDays;

    private LocalDate freezeCreditsResetDate;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public int getCurrentStreak() {
        return currentStreak;
    }

    public void setCurrentStreak(int currentStreak) {
        this.currentStreak = currentStreak;
    }

    public int getLongestStreak() {
        return longestStreak;
    }

    public void setLongestStreak(int longestStreak) {
        this.longestStreak = longestStreak;
    }

    public int getTotalCheckIns() {
        return totalCheckIns;
    }

    public void setTotalCheckIns(int totalCheckIns) {
        this.totalCheckIns = totalCheckIns;
    }

    public int getFreezeCredits() {
        return freezeCredits;
    }

    public void setFreezeCredits(int freezeCredits) {
        this.freezeCredits = freezeCredits;
    }

    public int getPerfectGreenDays() {
        return perfectGreenDays;
    }

    public void setPerfectGreenDays(int perfectGreenDays) {
        this.perfectGreenDays = perfectGreenDays;
    }

    public LocalDate getLastCheckInDate() {
        return lastCheckInDate;
    }

    public void setLastCheckInDate(LocalDate lastCheckInDate) {
        this.lastCheckInDate = lastCheckInDate;
    }

    public LocalDate getLastTipUnlockedDate() {
        return lastTipUnlockedDate;
    }

    public void setLastTipUnlockedDate(LocalDate lastTipUnlockedDate) {
        this.lastTipUnlockedDate = lastTipUnlockedDate;
    }

    public String getLastUnlockedTip() {
        return lastUnlockedTip;
    }

    public void setLastUnlockedTip(String lastUnlockedTip) {
        this.lastUnlockedTip = lastUnlockedTip;
    }

    public int getWeeklyBoxesClaimedInCycle() {
        return weeklyBoxesClaimedInCycle;
    }

    public void setWeeklyBoxesClaimedInCycle(int weeklyBoxesClaimedInCycle) {
        this.weeklyBoxesClaimedInCycle = weeklyBoxesClaimedInCycle;
    }

    public Integer getCustomMilestoneTargetDays() {
        return customMilestoneTargetDays;
    }

    public void setCustomMilestoneTargetDays(Integer customMilestoneTargetDays) {
        this.customMilestoneTargetDays = customMilestoneTargetDays;
    }

    public LocalDate getFreezeCreditsResetDate() {
        return freezeCreditsResetDate;
    }

    public void setFreezeCreditsResetDate(LocalDate freezeCreditsResetDate) {
        this.freezeCreditsResetDate = freezeCreditsResetDate;
    }
}
