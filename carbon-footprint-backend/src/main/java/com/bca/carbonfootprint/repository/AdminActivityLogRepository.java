package com.bca.carbonfootprint.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bca.carbonfootprint.model.AdminActivityLog;

public interface AdminActivityLogRepository extends JpaRepository<AdminActivityLog, Long> {

    List<AdminActivityLog> findTop20ByOrderByCreatedAtDesc();
}
