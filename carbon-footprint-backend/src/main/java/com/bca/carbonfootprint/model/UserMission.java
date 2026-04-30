package com.bca.carbonfootprint.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "user_mission",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_mission_week",
                columnNames = {"user_id", "week_start_date"}
        )
)
public class UserMission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "week_start_date", nullable = false)
    private LocalDate weekStartDate;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityType activityType;

    @Column(nullable = false)
    private double baselineQuantity;

    @Column(nullable = false)
    private double baselineEmission;

    @Column(nullable = false)
    private double targetQuantity;

    @Column(nullable = false)
    private double targetEmission;

    @Column(nullable = false)
    private double currentQuantity;

    @Column(nullable = false)
    private double currentEmission;

    @Column(nullable = false)
    private int rewardPoints;

    @Column(nullable = false)
    private boolean rewardGranted;

    private LocalDateTime completedAt;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDate getWeekStartDate() {
        return weekStartDate;
    }

    public void setWeekStartDate(LocalDate weekStartDate) {
        this.weekStartDate = weekStartDate;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ActivityType getActivityType() {
        return activityType;
    }

    public void setActivityType(ActivityType activityType) {
        this.activityType = activityType;
    }

    public double getBaselineQuantity() {
        return baselineQuantity;
    }

    public void setBaselineQuantity(double baselineQuantity) {
        this.baselineQuantity = baselineQuantity;
    }

    public double getBaselineEmission() {
        return baselineEmission;
    }

    public void setBaselineEmission(double baselineEmission) {
        this.baselineEmission = baselineEmission;
    }

    public double getTargetQuantity() {
        return targetQuantity;
    }

    public void setTargetQuantity(double targetQuantity) {
        this.targetQuantity = targetQuantity;
    }

    public double getTargetEmission() {
        return targetEmission;
    }

    public void setTargetEmission(double targetEmission) {
        this.targetEmission = targetEmission;
    }

    public double getCurrentQuantity() {
        return currentQuantity;
    }

    public void setCurrentQuantity(double currentQuantity) {
        this.currentQuantity = currentQuantity;
    }

    public double getCurrentEmission() {
        return currentEmission;
    }

    public void setCurrentEmission(double currentEmission) {
        this.currentEmission = currentEmission;
    }

    public int getRewardPoints() {
        return rewardPoints;
    }

    public void setRewardPoints(int rewardPoints) {
        this.rewardPoints = rewardPoints;
    }

    public boolean isRewardGranted() {
        return rewardGranted;
    }

    public void setRewardGranted(boolean rewardGranted) {
        this.rewardGranted = rewardGranted;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}
