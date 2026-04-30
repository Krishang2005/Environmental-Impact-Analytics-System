package com.bca.carbonfootprint.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;

import com.bca.carbonfootprint.dto.ZoneEmissionReportDTO;
import com.bca.carbonfootprint.model.ActivityType;
import com.bca.carbonfootprint.model.CarbonEntry;
import com.bca.carbonfootprint.model.User;

public interface CarbonEntryRepository extends JpaRepository<CarbonEntry, Long> {

    // ================= USER BASIC =================
    List<CarbonEntry> findByUser(User user);

    List<CarbonEntry> findByUserAndDateBetween(
            User user,
            LocalDate startDate,
            LocalDate endDate
    );

    CarbonEntry findTopByUser_IdOrderByDateDescIdDesc(Long userId);

    List<CarbonEntry> findByDateBetween(
            LocalDate startDate,
            LocalDate endDate
    );

    // ================= ZONE REPORT =================
    @Query("""
        SELECT new com.bca.carbonfootprint.dto.ZoneEmissionReportDTO(
            z.name,
            COALESCE(SUM(c.carbonAmount), 0)
        )
        FROM CarbonEntry c
        JOIN c.user u
        JOIN u.zone z
        GROUP BY z.name
    """)
    List<ZoneEmissionReportDTO> getTotalEmissionPerZone();

    @Query("""
        SELECT u.id, u.name, u.latitude, u.longitude,
               COALESCE(SUM(c.carbonAmount), 0)
        FROM CarbonEntry c
        JOIN c.user u
        WHERE u.latitude IS NOT NULL
          AND u.longitude IS NOT NULL
          AND u.latitude <> 0
          AND u.longitude <> 0
        GROUP BY u.id, u.name, u.latitude, u.longitude
    """)
    List<Object[]> getUserEmissionWithLocation();

    // ================= DASHBOARD =================
    @Query("""
        SELECT COALESCE(SUM(c.carbonAmount), 0)
        FROM CarbonEntry c
        WHERE c.user.id = :userId
        AND FUNCTION('MONTH', c.date) = :month
        AND FUNCTION('YEAR', c.date) = :year
    """)
    Double getMonthlyEmission(Long userId, int month, int year);

    @Query("""
        SELECT COALESCE(SUM(c.carbonAmount), 0)
        FROM CarbonEntry c
        WHERE c.user.id = :userId
        AND c.date = :today
    """)
    Double getTodayEmission(Long userId, LocalDate today);

    @Query("""
        SELECT COALESCE(SUM(c.carbonAmount), 0)
        FROM CarbonEntry c
        JOIN c.user u
        JOIN u.zone z
        WHERE z.id = :zoneId
        AND FUNCTION('MONTH', c.date) = :month
        AND FUNCTION('YEAR', c.date) = :year
    """)
    Double getZoneTotal(Long zoneId, int month, int year);

    @Query("""
        SELECT COALESCE(SUM(c.carbonAmount), 0)
        FROM CarbonEntry c
        WHERE FUNCTION('MONTH', c.date) = FUNCTION('MONTH', CURRENT_DATE)
        AND FUNCTION('YEAR', c.date) = FUNCTION('YEAR', CURRENT_DATE)
    """)
    Double getTotalCarbonThisMonth();

    @Query("""
        SELECT COALESCE(SUM(c.carbonAmount), 0)
        FROM CarbonEntry c
        WHERE c.date = :date
    """)
    Double getTotalCarbonByDate(LocalDate date);

    @Query("""
        SELECT COALESCE(SUM(c.carbonAmount), 0)
        FROM CarbonEntry c
        WHERE c.user.id = :userId
        AND c.date = CURRENT_DATE
    """)
    Double getTodayEmissionByUser(Long userId);

    @Query("""
        SELECT COUNT(c)
        FROM CarbonEntry c
        WHERE c.createdAt >= :since
    """)
    long countEntriesSince(LocalDateTime since);

    @Query("""
        SELECT COUNT(DISTINCT c.user.id)
        FROM CarbonEntry c
        WHERE c.createdAt >= :since
    """)
    long countDistinctUsersSince(LocalDateTime since);

    @Query("""
        SELECT c.id, u.name, c.carbonAmount, c.activityType, c.createdAt
        FROM CarbonEntry c
        JOIN c.user u
        WHERE c.createdAt IS NOT NULL
        ORDER BY c.createdAt DESC
    """)
    List<Object[]> findRecentEntryActivity(Pageable pageable);

    @Query("""
        SELECT z.id, z.name, COALESCE(SUM(c.carbonAmount), 0)
        FROM CarbonEntry c
        JOIN c.user u
        JOIN u.zone z
        WHERE c.date = :date
        GROUP BY z.id, z.name
    """)
    List<Object[]> getZoneDailyTotals(LocalDate date);

    @Query("""
    		SELECT COALESCE(SUM(c.carbonAmount), 0)
    		FROM CarbonEntry c
    		WHERE c.user.id = :userId
    		AND FUNCTION('MONTH', c.date) = FUNCTION('MONTH', CURRENT_DATE)
    		AND FUNCTION('YEAR', c.date) = FUNCTION('YEAR', CURRENT_DATE)
    		""")
    		Double getMonthlyEmissionByUser(Long userId);

    @Query("""
    		SELECT u.zone.id,
    		       u.zone.name,
    		       COALESCE(SUM(c.carbonAmount),0),
    		       COALESCE(AVG(c.carbonAmount),0)
    		FROM CarbonEntry c
    		JOIN c.user u
    		WHERE u.zone IS NOT NULL
    		GROUP BY u.zone.id, u.zone.name
    		""")
    		List<Object[]> getZoneEmissionSummary();

    @Query("""
        SELECT u.id, u.name, COALESCE(SUM(c.carbonAmount), 0)
        FROM User u
        LEFT JOIN u.carbonEntries c
          ON FUNCTION('MONTH', c.date) = :month
         AND FUNCTION('YEAR', c.date) = :year
        WHERE u.zone.id = :zoneId
          AND u.role.name = 'ROLE_USER'
        GROUP BY u.id, u.name
        ORDER BY COALESCE(SUM(c.carbonAmount), 0) ASC
    """)
    List<Object[]> getZoneLeaderboard(Long zoneId, int month, int year);

    @Query("""
        SELECT c.date, COALESCE(SUM(c.carbonAmount), 0)
        FROM CarbonEntry c
        WHERE c.user.id = :userId
          AND c.date BETWEEN :startDate AND :endDate
        GROUP BY c.date
    """)
    List<Object[]> getDailyTotalsByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);

    @Query("""
        SELECT c.activityType, COALESCE(SUM(c.quantity), 0), COALESCE(SUM(c.carbonAmount), 0)
        FROM CarbonEntry c
        WHERE c.user.id = :userId
          AND c.date BETWEEN :startDate AND :endDate
        GROUP BY c.activityType
        ORDER BY COALESCE(SUM(c.carbonAmount), 0) DESC
    """)
    List<Object[]> getActivityTotalsByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);

    @Query("""
        SELECT COALESCE(SUM(c.quantity), 0)
        FROM CarbonEntry c
        WHERE c.user.id = :userId
          AND c.activityType = :activityType
          AND c.date BETWEEN :startDate AND :endDate
    """)
    Double getActivityQuantityByUserAndDateRange(
            Long userId,
            ActivityType activityType,
            LocalDate startDate,
            LocalDate endDate
    );

    @Query("""
        SELECT COALESCE(SUM(c.carbonAmount), 0)
        FROM CarbonEntry c
        WHERE c.user.id = :userId
          AND c.activityType = :activityType
          AND c.date BETWEEN :startDate AND :endDate
    """)
    Double getActivityEmissionByUserAndDateRange(
            Long userId,
            ActivityType activityType,
            LocalDate startDate,
            LocalDate endDate
    );
}
