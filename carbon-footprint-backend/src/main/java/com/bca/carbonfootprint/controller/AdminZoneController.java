package com.bca.carbonfootprint.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.bca.carbonfootprint.dto.ZoneEmissionDTO;
import com.bca.carbonfootprint.dto.ZoneSummaryDTO;
import com.bca.carbonfootprint.repository.UserRepository;
import com.bca.carbonfootprint.service.ZoneService;

@RestController
@RequestMapping("/api/admin/zones")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminZoneController {

    @Autowired
    private ZoneService zoneService;

    @Autowired
    private UserRepository userRepository;

    // ================= ZONE SUMMARY =================
    @GetMapping("/summary")
    public List<ZoneSummaryDTO> getZoneSummary() {
        return zoneService.getZoneSummary();
    }

    // ================= ZONE EMISSION SUMMARY =================
    @GetMapping("/emissions")
    public List<ZoneEmissionDTO> getZoneEmissionSummary() {

        List<ZoneEmissionDTO> zones = zoneService.getZoneEmissionSummary();

        zones.forEach(zone -> {
            Long userCount = userRepository.countByZone_Id(zone.getZoneId());
            zone.setTotalUsers(userCount);
        });

        return zones;
    }

    // ================= MONTHLY ZONE EMISSION =================
    @GetMapping("/{zoneId}/total")
    public Double getZoneMonthlyTotal(
            @PathVariable Long zoneId,
            @RequestParam int month,
            @RequestParam int year) {

        return zoneService.getZoneMonthlyTotal(zoneId, month, year);
    }
}