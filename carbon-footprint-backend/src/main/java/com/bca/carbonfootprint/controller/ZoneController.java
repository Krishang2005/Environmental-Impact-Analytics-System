package com.bca.carbonfootprint.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.bca.carbonfootprint.model.Zone;
import com.bca.carbonfootprint.service.AdminActivityLogService;
import com.bca.carbonfootprint.service.ZoneService;

@RestController
@RequestMapping("/api/zones")
public class ZoneController {

    private final ZoneService zoneService;
    private final AdminActivityLogService adminActivityLogService;

    public ZoneController(ZoneService zoneService, AdminActivityLogService adminActivityLogService) {
        this.zoneService = zoneService;
        this.adminActivityLogService = adminActivityLogService;
    }

    // ================= VIEW ALL ZONES (ADMIN only) =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<Zone>> getAllZones() {
        return ResponseEntity.ok(zoneService.getAllZones());
    }

    // ================= VIEW SINGLE ZONE (ADMIN only) =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<Zone> getZoneById(@PathVariable Long id) {
        return ResponseEntity.ok(zoneService.getZoneById(id));
    }

    // ================= CREATE ZONE (ADMIN only) =================
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<String> createZone(@RequestBody Zone zone, Authentication authentication) {
        zoneService.saveZone(zone);
        adminActivityLogService.log(
                authentication != null ? authentication.getName() : null,
                "ZONE_CREATED",
                "Admin created " + zone.getName() + " zone boundary."
        );
        return ResponseEntity.ok("Zone created successfully");
    }

    // ================= UPDATE ZONE (ADMIN only) =================
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<String> updateZone(@PathVariable Long id,
                                             @RequestBody Zone zone,
                                             Authentication authentication) {
        zoneService.updateZone(id, zone);
        adminActivityLogService.log(
                authentication != null ? authentication.getName() : null,
                "ZONE_BOUNDARY_APPROVED",
                "Admin approved " + zone.getName() + " boundary update."
        );
        return ResponseEntity.ok("Zone updated successfully");
    }

    // ================= DELETE ZONE (ADMIN only) =================
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteZone(@PathVariable Long id, Authentication authentication) {
        Zone zone = zoneService.getZoneById(id);
        zoneService.deleteZone(id);
        adminActivityLogService.log(
                authentication != null ? authentication.getName() : null,
                "ZONE_DELETED",
                "Admin removed " + zone.getName() + " zone."
        );
        return ResponseEntity.ok("Zone deleted successfully");
    }
}
