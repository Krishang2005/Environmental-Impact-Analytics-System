package com.bca.carbonfootprint.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "user_daily_check_in",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_daily_check_in",
                columnNames = {"user_id", "check_in_date"}
        )
)
public class UserDailyCheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @Column(nullable = false)
    private boolean perfectGreenDay;

    @Column(length = 500)
    private String unlockedTip;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDate getCheckInDate() {
        return checkInDate;
    }

    public void setCheckInDate(LocalDate checkInDate) {
        this.checkInDate = checkInDate;
    }

    public boolean isPerfectGreenDay() {
        return perfectGreenDay;
    }

    public void setPerfectGreenDay(boolean perfectGreenDay) {
        this.perfectGreenDay = perfectGreenDay;
    }

    public String getUnlockedTip() {
        return unlockedTip;
    }

    public void setUnlockedTip(String unlockedTip) {
        this.unlockedTip = unlockedTip;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
