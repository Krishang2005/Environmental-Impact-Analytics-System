package com.bca.carbonfootprint.dto;

public class CommunityChallengeResponse {

    private String title;
    private String description;
    private String zoneName;
    private double goalReductionKg;
    private double currentEmission;
    private double targetEmission;
    private double progressPct;
    private double improvementPct;
    private int zoneRank;
    private int participantCount;

    public CommunityChallengeResponse(
            String title,
            String description,
            String zoneName,
            double goalReductionKg,
            double currentEmission,
            double targetEmission,
            double progressPct,
            double improvementPct,
            int zoneRank,
            int participantCount) {
        this.title = title;
        this.description = description;
        this.zoneName = zoneName;
        this.goalReductionKg = goalReductionKg;
        this.currentEmission = currentEmission;
        this.targetEmission = targetEmission;
        this.progressPct = progressPct;
        this.improvementPct = improvementPct;
        this.zoneRank = zoneRank;
        this.participantCount = participantCount;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getZoneName() {
        return zoneName;
    }

    public double getGoalReductionKg() {
        return goalReductionKg;
    }

    public double getCurrentEmission() {
        return currentEmission;
    }

    public double getTargetEmission() {
        return targetEmission;
    }

    public double getProgressPct() {
        return progressPct;
    }

    public double getImprovementPct() {
        return improvementPct;
    }

    public int getZoneRank() {
        return zoneRank;
    }

    public int getParticipantCount() {
        return participantCount;
    }
}
