package com.bca.carbonfootprint.service;

import java.util.List;

import com.bca.carbonfootprint.dto.ZoneSummaryDTO;
import com.bca.carbonfootprint.dto.ZoneEmissionDTO;
import com.bca.carbonfootprint.model.Zone;

public interface ZoneService {

    List<Zone> getAllZones();

    Zone getZoneById(Long id);

    Zone saveZone(Zone zone);

    Zone updateZone(Long id, Zone zone);

    void deleteZone(Long id);

    List<ZoneSummaryDTO> getZoneSummary();

    List<ZoneEmissionDTO> getZoneEmissionSummary();

    // ✅ NEW METHOD
    Double getZoneMonthlyTotal(Long zoneId, int month, int year);
}