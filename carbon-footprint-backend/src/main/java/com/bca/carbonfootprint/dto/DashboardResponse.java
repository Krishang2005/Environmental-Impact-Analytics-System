package com.bca.carbonfootprint.dto;

public class DashboardResponse {

    private double monthlyTotal;
    private double todayTotal;
    private double zoneAverage;
    private String status;

    public DashboardResponse(double monthlyTotal,
                             double todayTotal,
                             double zoneAverage,
                             String status) {
        this.monthlyTotal = monthlyTotal;
        this.todayTotal = todayTotal;
        this.zoneAverage = zoneAverage;
        this.status = status;
    }

    public double getMonthlyTotal() { return monthlyTotal; }
    public double getTodayTotal() { return todayTotal; }
    public double getZoneAverage() { return zoneAverage; }
    public String getStatus() { return status; }
}