package com.bca.carbonfootprint.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.bca.carbonfootprint.model.RewardEvent;

public interface RewardEventRepository extends JpaRepository<RewardEvent, Long> {

    boolean existsByUser_IdAndSourceAndReferenceKey(Long userId, String source, String referenceKey);

    List<RewardEvent> findTop20ByUser_IdOrderByCreatedAtDesc(Long userId);

    @Query("""
        SELECT COALESCE(SUM(r.points), 0)
        FROM RewardEvent r
        WHERE r.user.id = :userId
    """)
    Integer getTotalPointsByUser(Long userId);
}
