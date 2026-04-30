package com.bca.carbonfootprint.dto;

public class ImpactSimulationResponse {

    private double currentMonthlyEmission;
    private double plannedMonthlyEmission;
    private double monthlySavings;
    private double yearlySavings;
    private double equivalentTrees;
    private double equivalentCarKm;
    private String message;

    public ImpactSimulationResponse(
            double currentMonthlyEmission,
            double plannedMonthlyEmission,
            double monthlySavings,
            double yearlySavings,
            double equivalentTrees,
            double equivalentCarKm,
            String message) {
        this.currentMonthlyEmission = currentMonthlyEmission;
        this.plannedMonthlyEmission = plannedMonthlyEmission;
        this.monthlySavings = monthlySavings;
        this.yearlySavings = yearlySavings;
        this.equivalentTrees = equivalentTrees;
        this.equivalentCarKm = equivalentCarKm;
        this.message = message;
    }

    public double getCurrentMonthlyEmission() {
        return currentMonthlyEmission;
    }

    public double getPlannedMonthlyEmission() {
        return plannedMonthlyEmission;
    }

    public double getMonthlySavings() {
        return monthlySavings;
    }

    public double getYearlySavings() {
        return yearlySavings;
    }

    public double getEquivalentTrees() {
        return equivalentTrees;
    }

    public double getEquivalentCarKm() {
        return equivalentCarKm;
    }

    public String getMessage() {
        return message;
    }
}
