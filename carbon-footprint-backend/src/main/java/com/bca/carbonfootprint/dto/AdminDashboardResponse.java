package com.bca.carbonfootprint.dto;

public class AdminDashboardResponse {

    private Long totalUsers;
    private Long highEmitters;
    private Double monthlyCarbon;
    private Long totalZones;
    private Long openComplaints;
    private Long criticalComplaints;

    public AdminDashboardResponse(Long totalUsers,
                                  Long highEmitters,
                                  Double monthlyCarbon,
                                  Long totalZones,
                                  Long openComplaints,
                                  Long criticalComplaints) {
        this.totalUsers = totalUsers;
        this.highEmitters = highEmitters;
        this.monthlyCarbon = monthlyCarbon;
        this.totalZones = totalZones;
        this.openComplaints = openComplaints;
        this.criticalComplaints = criticalComplaints;
    }

    public Long getTotalUsers() {
        return totalUsers;
    }

    public Long getHighEmitters() {
        return highEmitters;
    }

    public Double getMonthlyCarbon() {
        return monthlyCarbon;
    }

    public Long getTotalZones() {
        return totalZones;
    }

    public Long getOpenComplaints() {
        return openComplaints;
    }

    public Long getCriticalComplaints() {
        return criticalComplaints;
    }
}
