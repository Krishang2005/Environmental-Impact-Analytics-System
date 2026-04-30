package com.bca.carbonfootprint.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bca.carbonfootprint.model.UserMission;

public interface UserMissionRepository extends JpaRepository<UserMission, Long> {

    Optional<UserMission> findByUser_IdAndWeekStartDate(Long userId, LocalDate weekStartDate);
}
