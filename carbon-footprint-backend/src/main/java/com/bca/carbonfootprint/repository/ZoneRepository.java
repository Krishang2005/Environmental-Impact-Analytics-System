package com.bca.carbonfootprint.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.bca.carbonfootprint.dto.ZoneEmissionDTO;
import com.bca.carbonfootprint.dto.ZoneSummaryDTO;
import com.bca.carbonfootprint.model.Zone;

public interface ZoneRepository extends JpaRepository<Zone, Long> {

    Optional<Zone> findByName(String name);

    // Existing summary
    @Query("""
        SELECT new com.bca.carbonfootprint.dto.ZoneSummaryDTO(
            z.id,
            z.name,
            COUNT(u)
        )
        FROM Zone z
        LEFT JOIN z.users u
        WITH u.role.name = 'ROLE_USER'
        GROUP BY z.id, z.name
    """)
    List<ZoneSummaryDTO> getZoneSummary();

    // ✅ NEW emission aggregation
    @Query("""
        SELECT new com.bca.carbonfootprint.dto.ZoneEmissionDTO(
            z.id,
            z.name,
            COALESCE(SUM(c.co2Amount), 0),
            COALESCE(AVG(c.co2Amount), 0)
        )
        FROM Zone z
        LEFT JOIN z.users u
        LEFT JOIN u.carbonEntries c
        WHERE u.role.name = 'ROLE_USER' OR u.role IS NULL
        GROUP BY z.id, z.name
    """)
    List<ZoneEmissionDTO> getZoneEmissionSummary();
}