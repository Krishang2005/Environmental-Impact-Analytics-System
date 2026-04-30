package com.bca.carbonfootprint.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bca.carbonfootprint.dto.ZoneUserDTO;
import com.bca.carbonfootprint.model.User;

public interface UserRepository extends JpaRepository<User, Long> {

    // ================= LOGIN =================
    Optional<User> findByEmail(String email);

    // ================= DASHBOARD =================
    long countByRole_Name(String roleName);
    long countByZone_Id(Long zoneId);

    // ================= ZONE SUMMARY =================
    @Query("""
        SELECT u.zone.name, u.sectorCategory, u.sectorType, COUNT(u)
        FROM User u
        WHERE u.zone IS NOT NULL
        AND u.role.name = 'ROLE_USER'
        GROUP BY u.zone.name, u.sectorCategory, u.sectorType
    """)
    List<Object[]> getZoneSectorCounts();

    // ================= ALL NORMAL USERS =================
    @Query("""
        SELECT u FROM User u
        WHERE u.role.name = 'ROLE_USER'
    """)
    List<User> findAllNormalUsers();

    // ================= USERS BY ZONE NAME =================
    List<User> findByZone_Name(String zoneName);

    // ================= USERS BY ZONE ID (USED IN ADMIN ZONES PAGE) =================
    List<User> findByZone_Id(Long zoneId);

    // ================= LIGHTWEIGHT QUERY FOR MAP =================
   
  
    @Query("""
    		SELECT new com.bca.carbonfootprint.dto.ZoneUserDTO(
    		    u.id,
    		    u.name,
    		    u.email,
    		    u.address,
    		    COALESCE(SUM(CASE
    		        WHEN c.date = CURRENT_DATE THEN c.co2Amount
    		        ELSE 0
    		    END), 0),
    		    COALESCE(SUM(CASE
    		        WHEN FUNCTION('MONTH', c.date) = FUNCTION('MONTH', CURRENT_DATE)
    		         AND FUNCTION('YEAR', c.date) = FUNCTION('YEAR', CURRENT_DATE)
    		        THEN c.co2Amount
    		        ELSE 0
    		    END), 0),
    		    u.latitude,
    		    u.longitude
    		)
    		FROM User u
    		LEFT JOIN u.carbonEntries c
    		WHERE u.zone.id = :zoneId
            AND u.role.name = 'ROLE_USER'
    		GROUP BY u.id, u.name, u.email, u.address, u.latitude, u.longitude
    		""")
    		List<ZoneUserDTO> findUsersByZoneId(Long zoneId);
}
