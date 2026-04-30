package com.bca.carbonfootprint.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bca.carbonfootprint.model.IssueVote;

public interface IssueVoteRepository extends JpaRepository<IssueVote, Long> {

    long countByIssue_Id(Long issueId);

    boolean existsByIssue_IdAndUser_Id(Long issueId, Long userId);

    Optional<IssueVote> findByIssue_IdAndUser_Id(Long issueId, Long userId);
}
