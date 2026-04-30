package com.bca.carbonfootprint.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bca.carbonfootprint.model.UserMonthlyGoal;

public interface UserMonthlyGoalRepository extends JpaRepository<UserMonthlyGoal, Long> {

    Optional<UserMonthlyGoal> findByUserIdAndGoalMonthAndGoalYear(Long userId, int goalMonth, int goalYear);
}
