package com.bca.carbonfootprint.dto;

import java.util.List;

public class GoalProgressResponse {

    private int month;
    private int year;
    private double targetReductionPct;
    private double baselineEmissionKg;
    private double currentEmissionKg;
    private double targetReductionKg;
    private double targetEmissionKg;
    private double actualReductionKg;
    private double progressPct;
    private boolean weeklySummaryEnabled;
    private int gamificationLevel;
    private int gamificationXp;
    private String statusMessage;
    private List<String> unlockedBadges;
    private List<GoalMilestoneResponse> milestones;

    public GoalProgressResponse(
            int month,
            int year,
            double targetReductionPct,
            double baselineEmissionKg,
            double currentEmissionKg,
            double targetReductionKg,
            double targetEmissionKg,
            double actualReductionKg,
            double progressPct,
            boolean weeklySummaryEnabled,
            int gamificationLevel,
            int gamificationXp,
            String statusMessage,
            List<String> unlockedBadges,
            List<GoalMilestoneResponse> milestones
    ) {
        this.month = month;
        this.year = year;
        this.targetReductionPct = targetReductionPct;
        this.baselineEmissionKg = baselineEmissionKg;
        this.currentEmissionKg = currentEmissionKg;
        this.targetReductionKg = targetReductionKg;
        this.targetEmissionKg = targetEmissionKg;
        this.actualReductionKg = actualReductionKg;
        this.progressPct = progressPct;
        this.weeklySummaryEnabled = weeklySummaryEnabled;
        this.gamificationLevel = gamificationLevel;
        this.gamificationXp = gamificationXp;
        this.statusMessage = statusMessage;
        this.unlockedBadges = unlockedBadges;
        this.milestones = milestones;
    }

    public int getMonth() {
        return month;
    }

    public int getYear() {
        return year;
    }

    public double getTargetReductionPct() {
        return targetReductionPct;
    }

    public double getBaselineEmissionKg() {
        return baselineEmissionKg;
    }

    public double getCurrentEmissionKg() {
        return currentEmissionKg;
    }

    public double getTargetReductionKg() {
        return targetReductionKg;
    }

    public double getTargetEmissionKg() {
        return targetEmissionKg;
    }

    public double getActualReductionKg() {
        return actualReductionKg;
    }

    public double getProgressPct() {
        return progressPct;
    }

    public boolean isWeeklySummaryEnabled() {
        return weeklySummaryEnabled;
    }

    public int getGamificationLevel() {
        return gamificationLevel;
    }

    public int getGamificationXp() {
        return gamificationXp;
    }

    public String getStatusMessage() {
        return statusMessage;
    }

    public List<String> getUnlockedBadges() {
        return unlockedBadges;
    }

    public List<GoalMilestoneResponse> getMilestones() {
        return milestones;
    }
}
