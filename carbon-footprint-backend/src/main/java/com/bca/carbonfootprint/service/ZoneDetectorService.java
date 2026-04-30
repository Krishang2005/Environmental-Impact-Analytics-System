package com.bca.carbonfootprint.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bca.carbonfootprint.model.Zone;
import com.bca.carbonfootprint.repository.ZoneRepository;

@Service
public class ZoneDetectorService {

    @Autowired
    private ZoneRepository zoneRepository;

    public Zone detectZone(double lat, double lng) {

        List<Zone> zones = zoneRepository.findAll();

        for (Zone zone : zones) {

            if (lat >= zone.getMinLatitude() &&
                lat <= zone.getMaxLatitude() &&
                lng >= zone.getMinLongitude() &&
                lng <= zone.getMaxLongitude()) {

                return zone;
            }
        }

        return null;
    }
}