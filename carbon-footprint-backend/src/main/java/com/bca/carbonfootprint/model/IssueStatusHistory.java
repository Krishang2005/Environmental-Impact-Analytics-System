package com.bca.carbonfootprint.model;

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

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "issue_status_history")
public class IssueStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "issue_id", nullable = false)
    private EnvironmentalIssue issue;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 40)
    private IssueStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 40)
    private IssueStatus newStatus;

    @Column(length = 800)
    private String note;

    private String proofImageUrl;

    @Column(nullable = false)
    private LocalDateTime changedAt;

    @Column(nullable = false, length = 120)
    private String changedBy;

    public Long getId() {
        return id;
    }

    public EnvironmentalIssue getIssue() {
        return issue;
    }

    public void setIssue(EnvironmentalIssue issue) {
        this.issue = issue;
    }

    public IssueStatus getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(IssueStatus previousStatus) {
        this.previousStatus = previousStatus;
    }

    public IssueStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(IssueStatus newStatus) {
        this.newStatus = newStatus;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getProofImageUrl() {
        return proofImageUrl;
    }

    public void setProofImageUrl(String proofImageUrl) {
        this.proofImageUrl = proofImageUrl;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }

    public void setChangedAt(LocalDateTime changedAt) {
        this.changedAt = changedAt;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(String changedBy) {
        this.changedBy = changedBy;
    }
}
