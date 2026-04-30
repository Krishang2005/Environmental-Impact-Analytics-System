package com.bca.carbonfootprint.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.bca.carbonfootprint.model.UserDailyCheckIn;

public interface UserDailyCheckInRepository extends JpaRepository<UserDailyCheckIn, Long> {

    boolean existsByUser_IdAndCheckInDate(Long userId, LocalDate checkInDate);

    long countByUser_Zone_IdAndCheckInDate(Long zoneId, LocalDate checkInDate);

    long countByCheckInDate(LocalDate checkInDate);

    @Query("""
        SELECT c.checkInDate, c.perfectGreenDay
        FROM UserDailyCheckIn c
        WHERE c.user.id = :userId
          AND c.checkInDate BETWEEN :startDate AND :endDate
        ORDER BY c.checkInDate ASC
    """)
    List<Object[]> getCheckInWindow(Long userId, LocalDate startDate, LocalDate endDate);

    @Query("""
        SELECT z.id, z.name, COUNT(c)
        FROM UserDailyCheckIn c
        JOIN c.user u
        JOIN u.zone z
        WHERE c.checkInDate = :checkInDate
          AND u.role.name = 'ROLE_USER'
        GROUP BY z.id, z.name
        ORDER BY COUNT(c) DESC, z.name ASC
    """)
    List<Object[]> getZoneCompetitionByDate(LocalDate checkInDate);
}
