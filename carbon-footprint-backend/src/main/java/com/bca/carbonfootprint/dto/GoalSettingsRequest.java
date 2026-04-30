package com.bca.carbonfootprint.dto;

public class GoalSettingsRequest {

    private Double targetReductionPct;
    private Boolean weeklySummaryEnabled;

    public Double getTargetReductionPct() {
        return targetReductionPct;
    }

    public void setTargetReductionPct(Double targetReductionPct) {
        this.targetReductionPct = targetReductionPct;
    }

    public Boolean getWeeklySummaryEnabled() {
        return weeklySummaryEnabled;
    }

    public void setWeeklySummaryEnabled(Boolean weeklySummaryEnabled) {
        this.weeklySummaryEnabled = weeklySummaryEnabled;
    }
}
