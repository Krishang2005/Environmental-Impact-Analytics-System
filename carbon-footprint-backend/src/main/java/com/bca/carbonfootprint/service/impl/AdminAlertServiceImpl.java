package com.bca.carbonfootprint.service.impl;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bca.carbonfootprint.dto.AdminDashboardResponse;
import com.bca.carbonfootprint.dto.HighEmitterResponse;
import com.bca.carbonfootprint.dto.ZoneEmissionResponse;
import com.bca.carbonfootprint.dto.ZoneSectorSummaryResponse;
import com.bca.carbonfootprint.dto.ZoneUserResponse;
import com.bca.carbonfootprint.model.AlertStatus;
import com.bca.carbonfootprint.model.HighEmitterAlert;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.repository.CarbonEntryRepository;
import com.bca.carbonfootprint.repository.HighEmitterAlertRepository;
import com.bca.carbonfootprint.repository.UserRepository;
import com.bca.carbonfootprint.repository.ZoneRepository;
import com.bca.carbonfootprint.service.AdminAlertService;

@Service
public class AdminAlertServiceImpl implements AdminAlertService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HighEmitterAlertRepository alertRepository;

    @Autowired
    private CarbonEntryRepository carbonEntryRepository;

    @Autowired
    private ZoneRepository zoneRepository;

    // ================= DASHBOARD =================
    @Override
    public AdminDashboardResponse getAdminDashboard() {

        Long totalUsers = userRepository.countByRole_Name("ROLE_USER");

        Long highEmitters =
                alertRepository.countByStatus(AlertStatus.PENDING);

        Double monthlyCarbon =
                carbonEntryRepository.getTotalCarbonThisMonth();

        if (monthlyCarbon == null) monthlyCarbon = 0.0;

        Long totalZones = zoneRepository.count();

        return new AdminDashboardResponse(
                totalUsers,
                highEmitters,
                monthlyCarbon,
                totalZones,
                0L,
                0L
        );
    }

    // ================= HIGH EMITTERS =================
    @Override
    public List<HighEmitterResponse> getPendingHighEmitters() {

        List<HighEmitterAlert> alerts =
                alertRepository.findByStatus(AlertStatus.PENDING);

        List<HighEmitterResponse> response = new ArrayList<>();

        for (HighEmitterAlert alert : alerts) {

            HighEmitterResponse dto = new HighEmitterResponse();

            dto.setUserId(alert.getUser() != null ? alert.getUser().getId() : null);
            dto.setName(alert.getUser() != null ? alert.getUser().getName() : "User");
            dto.setEmail(alert.getUser() != null ? alert.getUser().getEmail() : null);
            dto.setZoneName(alert.getUser() != null && alert.getUser().getZone() != null
                    ? alert.getUser().getZone().getName()
                    : "No zone");
            dto.setTotalEmission(alert.getTotalEmission());
            dto.setThresholdKg(alert.getThresholdValue());
            dto.setAlertStatus(alert.getStatus() != null ? alert.getStatus().name() : "PENDING");

            response.add(dto);
        }

        return response;
    }

    // ================= ZONE SUMMARY =================
    @Override
    public List<ZoneSectorSummaryResponse> getZoneSectorSummary() {

        List<Object[]> results = userRepository.getZoneSectorCounts();
        List<ZoneSectorSummaryResponse> response = new ArrayList<>();

        for (Object[] row : results) {

            String zoneName = (String) row[0];
            String sectorCategory = row[1] != null ? row[1].toString() : null;
            String sectorType = row[2] != null ? row[2].toString() : null;
            Long count = (Long) row[3];

            response.add(
                new ZoneSectorSummaryResponse(
                        zoneName,
                        sectorCategory,
                        sectorType,
                        count
                )
            );
        }

        return response;
    }

    // ================= USERS BY ZONE =================
    @Override
    public List<ZoneUserResponse> getUsersByZone(Long zoneId) {

        List<User> users = userRepository.findByZone_Id(zoneId);

        return users.stream().map(user -> {

            ZoneUserResponse dto = new ZoneUserResponse();

            dto.setId(user.getId());
            dto.setName(user.getName());
            dto.setEmail(user.getEmail());
            dto.setAddress(user.getAddress());
            dto.setCategory(user.getSectorCategory().name());
            dto.setSectorType(user.getSectorType().name());
            dto.setLatitude(user.getLatitude());
            dto.setLongitude(user.getLongitude());

            Double todayEmission =
                    carbonEntryRepository.getTodayEmission(
                            user.getId(),
                            LocalDate.now()
                    );

            if (todayEmission == null) todayEmission = 0.0;

            Double monthlyEmission =
                    carbonEntryRepository.getMonthlyEmission(
                            user.getId(),
                            LocalDate.now().getMonthValue(),
                            LocalDate.now().getYear()
                    );

            if (monthlyEmission == null) monthlyEmission = 0.0;

            dto.setTodayEmission(todayEmission);
            dto.setMonthlyEmission(monthlyEmission);

            return dto;

        }).toList();
    }

    // ================= ZONE EMISSIONS =================
    @Override
    public List<ZoneEmissionResponse> getZoneEmissions() {

        List<Object[]> results =
                carbonEntryRepository.getZoneEmissionSummary();

        List<ZoneEmissionResponse> response = new ArrayList<>();

        for (Object[] row : results) {

            Long zoneId = (Long) row[0];
            String zoneName = (String) row[1];
            Double totalEmission = (Double) row[2];
            Double averageEmission = (Double) row[3];

            if (totalEmission == null) totalEmission = 0.0;
            if (averageEmission == null) averageEmission = 0.0;

            ZoneEmissionResponse dto =
                    new ZoneEmissionResponse(
                            zoneId,
                            zoneName,
                            totalEmission,
                            averageEmission
                    );

            Long userCount =
                    userRepository.countByZone_Id(zoneId);

            dto.setTotalUsers(userCount);

            response.add(dto);
        }

        return response;
    }

    // ================= ALERT CREATION =================
    @Override
    public void checkAndCreateAlert(Long userId, Double emission) {

        User user = userRepository.findById(userId).orElse(null);
        double threshold = user != null
                && user.getZone() != null
                && user.getZone().getEmissionLimitMaxKg() != null
                ? user.getZone().getEmissionLimitMaxKg()
                : 400.0;

        if (emission > threshold) {

            boolean exists = alertRepository
                    .existsByUserIdAndYearAndMonthAndStatus(
                            userId,
                            LocalDate.now().getYear(),
                            LocalDate.now().getMonthValue(),
                            AlertStatus.PENDING
                    );

            if (!exists) {
                HighEmitterAlert alert = new HighEmitterAlert();
                alert.setUser(user);
                alert.setZone(user != null ? user.getZone() : null);
                alert.setTotalEmission(emission);
                alert.setThresholdValue(threshold);
                alert.setYear(LocalDate.now().getYear());
                alert.setMonth(LocalDate.now().getMonthValue());
                alert.setCreatedAt(java.time.LocalDateTime.now());
                alert.setStatus(AlertStatus.PENDING);
                alertRepository.save(alert);
            }

        }
    }
}
