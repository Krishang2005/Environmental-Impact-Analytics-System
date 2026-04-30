package com.bca.carbonfootprint.controller;

import com.bca.carbonfootprint.repository.CarbonEntryRepository;
import com.bca.carbonfootprint.repository.UserRepository;
import com.bca.carbonfootprint.service.AdminAlertService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminMapController {

    private final CarbonEntryRepository carbonEntryRepository;
    private final UserRepository userRepository;
    private final AdminAlertService adminAlertService;

    private static final double DEFAULT_HIGH_EMISSION_THRESHOLD = 400;

    public AdminMapController(
            CarbonEntryRepository carbonEntryRepository,
            UserRepository userRepository,
            AdminAlertService adminAlertService) {

        this.carbonEntryRepository = carbonEntryRepository;
        this.userRepository = userRepository;
        this.adminAlertService = adminAlertService;
    }

    @GetMapping("/emission-locations")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> getEmissionLocations() {

        List<Object[]> results =
                carbonEntryRepository.getUserEmissionWithLocation();

        List<Map<String, Object>> response = new ArrayList<>();

        for (Object[] row : results) {

            Long userId = (Long) row[0];
            String name = (String) row[1];
            Double lat = (Double) row[2];
            Double lon = (Double) row[3];
            Double emission = (Double) row[4];
            double threshold = userRepository.findById(userId)
                    .map(user -> user.getZone() != null && user.getZone().getEmissionLimitMaxKg() != null
                            ? user.getZone().getEmissionLimitMaxKg()
                            : DEFAULT_HIGH_EMISSION_THRESHOLD)
                    .orElse(DEFAULT_HIGH_EMISSION_THRESHOLD);

            boolean isHighEmitter =
                    emission != null && emission > threshold;

            // 🔥 Call Service (clean architecture)
            if (isHighEmitter) {
                adminAlertService.checkAndCreateAlert(userId, emission);
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", userId);
            map.put("name", name);
            map.put("lat", lat);
            map.put("lon", lon);
            map.put("emission", emission);
            map.put("highEmitter", isHighEmitter);
            map.put("threshold", threshold);

            response.add(map);
        }

        return response;
    }
}
