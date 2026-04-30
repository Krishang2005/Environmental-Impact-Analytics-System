package com.bca.carbonfootprint.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bca.carbonfootprint.model.HighEmitterAlert;
import com.bca.carbonfootprint.model.AlertStatus;

public interface HighEmitterAlertRepository
        extends JpaRepository<HighEmitterAlert, Long> {

    List<HighEmitterAlert> findByStatus(AlertStatus status);
    Long countByStatus(AlertStatus status);

    boolean existsByUserIdAndYearAndMonthAndStatus(
            Long userId,
            int year,
            int month,
            AlertStatus status
    );
}