package com.bca.carbonfootprint.dto;

import java.util.List;

public class EmissionPredictionResponse {

    private String zoneName;
    private double targetRangeMinKg;
    private double targetRangeMaxKg;
    private boolean zoneLimitConfigured;
    private double currentEmissionKg;
    private double projectedEmissionKg;
    private double remainingBudgetKg;
    private double usagePct;
    private double projectedUsagePct;
    private int daysElapsed;
    private int daysRemaining;
    private String riskLevel;
    private String headline;
    private String summary;
    private List<ActionRecommendationResponse> recommendations;

    public EmissionPredictionResponse(
            String zoneName,
            double targetRangeMinKg,
            double targetRangeMaxKg,
            boolean zoneLimitConfigured,
            double currentEmissionKg,
            double projectedEmissionKg,
            double remainingBudgetKg,
            double usagePct,
            double projectedUsagePct,
            int daysElapsed,
            int daysRemaining,
            String riskLevel,
            String headline,
            String summary,
            List<ActionRecommendationResponse> recommendations
    ) {
        this.zoneName = zoneName;
        this.targetRangeMinKg = targetRangeMinKg;
        this.targetRangeMaxKg = targetRangeMaxKg;
        this.zoneLimitConfigured = zoneLimitConfigured;
        this.currentEmissionKg = currentEmissionKg;
        this.projectedEmissionKg = projectedEmissionKg;
        this.remainingBudgetKg = remainingBudgetKg;
        this.usagePct = usagePct;
        this.projectedUsagePct = projectedUsagePct;
        this.daysElapsed = daysElapsed;
        this.daysRemaining = daysRemaining;
        this.riskLevel = riskLevel;
        this.headline = headline;
        this.summary = summary;
        this.recommendations = recommendations;
    }

    public String getZoneName() {
        return zoneName;
    }

    public double getTargetRangeMinKg() {
        return targetRangeMinKg;
    }

    public double getTargetRangeMaxKg() {
        return targetRangeMaxKg;
    }

    public boolean isZoneLimitConfigured() {
        return zoneLimitConfigured;
    }

    public double getCurrentEmissionKg() {
        return currentEmissionKg;
    }

    public double getProjectedEmissionKg() {
        return projectedEmissionKg;
    }

    public double getRemainingBudgetKg() {
        return remainingBudgetKg;
    }

    public double getUsagePct() {
        return usagePct;
    }

    public double getProjectedUsagePct() {
        return projectedUsagePct;
    }

    public int getDaysElapsed() {
        return daysElapsed;
    }

    public int getDaysRemaining() {
        return daysRemaining;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public String getHeadline() {
        return headline;
    }

    public String getSummary() {
        return summary;
    }

    public List<ActionRecommendationResponse> getRecommendations() {
        return recommendations;
    }
}
