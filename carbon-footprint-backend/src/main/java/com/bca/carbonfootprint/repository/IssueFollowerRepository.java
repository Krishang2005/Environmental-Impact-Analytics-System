package com.bca.carbonfootprint.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bca.carbonfootprint.model.IssueFollower;

public interface IssueFollowerRepository extends JpaRepository<IssueFollower, Long> {

    long countByIssue_Id(Long issueId);

    boolean existsByIssue_IdAndUser_Id(Long issueId, Long userId);

    Optional<IssueFollower> findByIssue_IdAndUser_Id(Long issueId, Long userId);
}
