package com.bca.carbonfootprint.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "user_monthly_goals",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "goal_month", "goal_year"})
)
public class UserMonthlyGoal {

    private static final double DEFAULT_TARGET_REDUCTION_PCT = 20.0;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "goal_month", nullable = false)
    private int goalMonth;

    @Column(name = "goal_year", nullable = false)
    private int goalYear;

    @Column(name = "target_reduction_pct", nullable = false)
    private double targetReductionPct = DEFAULT_TARGET_REDUCTION_PCT;

    @Column(name = "weekly_summary_enabled", nullable = false)
    private boolean weeklySummaryEnabled = true;

    @Column(name = "last_summary_week_key")
    private String lastSummaryWeekKey;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;

        if (targetReductionPct <= 0) {
            targetReductionPct = DEFAULT_TARGET_REDUCTION_PCT;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public int getGoalMonth() {
        return goalMonth;
    }

    public void setGoalMonth(int goalMonth) {
        this.goalMonth = goalMonth;
    }

    public int getGoalYear() {
        return goalYear;
    }

    public void setGoalYear(int goalYear) {
        this.goalYear = goalYear;
    }

    public double getTargetReductionPct() {
        return targetReductionPct;
    }

    public void setTargetReductionPct(double targetReductionPct) {
        this.targetReductionPct = targetReductionPct;
    }

    public boolean isWeeklySummaryEnabled() {
        return weeklySummaryEnabled;
    }

    public void setWeeklySummaryEnabled(boolean weeklySummaryEnabled) {
        this.weeklySummaryEnabled = weeklySummaryEnabled;
    }

    public String getLastSummaryWeekKey() {
        return lastSummaryWeekKey;
    }

    public void setLastSummaryWeekKey(String lastSummaryWeekKey) {
        this.lastSummaryWeekKey = lastSummaryWeekKey;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
