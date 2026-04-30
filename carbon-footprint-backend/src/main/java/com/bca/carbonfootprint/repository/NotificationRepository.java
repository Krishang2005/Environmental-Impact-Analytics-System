package com.bca.carbonfootprint.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bca.carbonfootprint.model.Notification;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository 
        extends JpaRepository<Notification, Long> {

    List<Notification> findByUserId(Long userId);

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndReadStatusFalse(Long userId);

    long countByUserIdAndReadStatusFalse(Long userId);

    boolean existsByUserIdAndTypeAndReferencePeriod(
            Long userId,
            String type,
            String referencePeriod
    );

    boolean existsByUserIdAndCreatedAtAfter(
            Long userId,
            LocalDateTime dateTime);
}
