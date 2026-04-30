package com.bca.carbonfootprint.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bca.carbonfootprint.model.IssueStatusHistory;

public interface IssueStatusHistoryRepository extends JpaRepository<IssueStatusHistory, Long> {

    List<IssueStatusHistory> findByIssue_IdOrderByChangedAtAsc(Long issueId);
}
