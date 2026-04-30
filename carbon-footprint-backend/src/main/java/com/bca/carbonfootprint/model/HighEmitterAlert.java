package com.bca.carbonfootprint.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "high_emitter_alert")
public class HighEmitterAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double totalEmission;

    private Double thresholdValue;

    private int year;     // 🔥 NEW
    private int month;    // 🔥 NEW

    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    private AlertStatus status;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "zone_id")
    private Zone zone;

    // ===== Getters & Setters =====

    public Long getId() { return id; }

    public Double getTotalEmission() { return totalEmission; }
    public void setTotalEmission(Double totalEmission) {
        this.totalEmission = totalEmission;
    }

    public Double getThresholdValue() { return thresholdValue; }
    public void setThresholdValue(Double thresholdValue) {
        this.thresholdValue = thresholdValue;
    }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public int getMonth() { return month; }
    public void setMonth(int month) { this.month = month; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public AlertStatus getStatus() { return status; }
    public void setStatus(AlertStatus status) {
        this.status = status;
    }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Zone getZone() { return zone; }
    public void setZone(Zone zone) { this.zone = zone; }
}