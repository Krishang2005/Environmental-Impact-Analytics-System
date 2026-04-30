package com.bca.carbonfootprint.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bca.carbonfootprint.dto.ZoneEmissionDTO;
import com.bca.carbonfootprint.dto.ZoneSummaryDTO;
import com.bca.carbonfootprint.model.Zone;
import com.bca.carbonfootprint.repository.ZoneRepository;
import com.bca.carbonfootprint.repository.CarbonEntryRepository;
import com.bca.carbonfootprint.service.ZoneService;

@Service
public class ZoneServiceImpl implements ZoneService {

    private static final double DEFAULT_ZONE_LIMIT_MIN_KG = 250.0;
    private static final double DEFAULT_ZONE_LIMIT_MAX_KG = 400.0;
    private static final double DEFAULT_OVERLAY_OPACITY = 0.9;
    private static final String DEFAULT_OVERLAY_FIT = "contain";

    @Autowired
    private ZoneRepository zoneRepository;

    @Autowired
    private CarbonEntryRepository carbonEntryRepository;

    @Override
    public List<Zone> getAllZones() {
        return zoneRepository.findAll();
    }

    @Override
    public Zone getZoneById(Long id) {
        return zoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zone not found with id: " + id));
    }

    @Override
    public Zone saveZone(Zone zone) {
        applyEmissionLimitDefaults(zone);
        applyOverlayDefaults(zone);
        validateEmissionRange(zone.getEmissionLimitMinKg(), zone.getEmissionLimitMaxKg());
        validateOverlaySettings(zone.getOverlayOpacity(), zone.getOverlayFit());
        return zoneRepository.save(zone);
    }

    @Override
    public Zone updateZone(Long id, Zone zone) {
        Zone existing = getZoneById(id);

        existing.setName(zone.getName());
        existing.setMinLatitude(zone.getMinLatitude());
        existing.setMaxLatitude(zone.getMaxLatitude());
        existing.setMinLongitude(zone.getMinLongitude());
        existing.setMaxLongitude(zone.getMaxLongitude());
        existing.setEmissionLimitMinKg(zone.getEmissionLimitMinKg());
        existing.setEmissionLimitMaxKg(zone.getEmissionLimitMaxKg());
        existing.setOverlayImageUrl(zone.getOverlayImageUrl());
        existing.setOverlayOpacity(zone.getOverlayOpacity());
        existing.setOverlayFit(zone.getOverlayFit());

        applyEmissionLimitDefaults(existing);
        applyOverlayDefaults(existing);
        validateEmissionRange(existing.getEmissionLimitMinKg(), existing.getEmissionLimitMaxKg());
        validateOverlaySettings(existing.getOverlayOpacity(), existing.getOverlayFit());

        return zoneRepository.save(existing);
    }

    @Override
    public void deleteZone(Long id) {
        zoneRepository.deleteById(id);
    }

    @Override
    public List<ZoneSummaryDTO> getZoneSummary() {
        return zoneRepository.getZoneSummary();
    }

    @Override
    public List<ZoneEmissionDTO> getZoneEmissionSummary() {
        return zoneRepository.getZoneEmissionSummary();
    }

    // ✅ NEW IMPLEMENTATION
    @Override
    public Double getZoneMonthlyTotal(Long zoneId, int month, int year) {
        return carbonEntryRepository.getZoneTotal(zoneId, month, year);
    }

    private void applyEmissionLimitDefaults(Zone zone) {
        if (zone.getEmissionLimitMinKg() == null) {
            zone.setEmissionLimitMinKg(DEFAULT_ZONE_LIMIT_MIN_KG);
        }
        if (zone.getEmissionLimitMaxKg() == null) {
            zone.setEmissionLimitMaxKg(DEFAULT_ZONE_LIMIT_MAX_KG);
        }
    }

    private void applyOverlayDefaults(Zone zone) {
        if (zone.getOverlayOpacity() == null) {
            zone.setOverlayOpacity(DEFAULT_OVERLAY_OPACITY);
        }
        if (zone.getOverlayFit() == null || zone.getOverlayFit().isBlank()) {
            zone.setOverlayFit(DEFAULT_OVERLAY_FIT);
        }
        if (zone.getOverlayImageUrl() != null) {
            zone.setOverlayImageUrl(zone.getOverlayImageUrl().trim());
        }
    }

    private void validateEmissionRange(Double minKg, Double maxKg) {
        if (minKg == null || maxKg == null) {
            return;
        }
        if (minKg < 0 || maxKg < 0) {
            throw new IllegalArgumentException("Emission limits must be non-negative");
        }
        if (minKg > maxKg) {
            throw new IllegalArgumentException("Minimum emission limit cannot be greater than maximum emission limit");
        }
    }

    private void validateOverlaySettings(Double opacity, String fit) {
        if (opacity != null && (opacity < 0.1 || opacity > 1.0)) {
            throw new IllegalArgumentException("Overlay opacity must stay between 0.1 and 1.0");
        }
        if (fit == null) {
            return;
        }
        if (!"contain".equalsIgnoreCase(fit) && !"cover".equalsIgnoreCase(fit)) {
            throw new IllegalArgumentException("Overlay fit must be either contain or cover");
        }
    }
}
