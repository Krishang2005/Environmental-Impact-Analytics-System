package com.bca.carbonfootprint.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bca.carbonfootprint.model.EnvironmentalIssue;
import com.bca.carbonfootprint.model.IssueStatus;
import com.bca.carbonfootprint.model.IssueType;

public interface EnvironmentalIssueRepository extends JpaRepository<EnvironmentalIssue, Long> {

    List<EnvironmentalIssue> findAllByOrderByReportedAtDesc();

    List<EnvironmentalIssue> findTop20ByOrderByReportedAtDesc();

    List<EnvironmentalIssue> findByReporter_IdOrderByReportedAtDesc(Long reporterId);

    List<EnvironmentalIssue> findAllByReportedAtAfterOrderByReportedAtAsc(LocalDateTime since);

    long countByStatus(IssueStatus status);

    long countByStatusAndReportedAtAfter(IssueStatus status, LocalDateTime since);

    long countByReporter_IdAndReportedAtAfter(Long reporterId, LocalDateTime since);

    long countByIssueType(IssueType issueType);

    long countByVehiclePlateNumberIgnoreCase(String vehiclePlateNumber);
}
