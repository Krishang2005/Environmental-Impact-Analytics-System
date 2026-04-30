package com.bca.carbonfootprint.service;

import java.util.List;

import com.bca.carbonfootprint.dto.AdminDashboardResponse;
import com.bca.carbonfootprint.dto.HighEmitterResponse;
import com.bca.carbonfootprint.dto.ZoneSectorSummaryResponse;
import com.bca.carbonfootprint.dto.ZoneEmissionResponse;
import com.bca.carbonfootprint.dto.ZoneUserResponse;

public interface AdminAlertService {

    AdminDashboardResponse getAdminDashboard();

    List<HighEmitterResponse> getPendingHighEmitters();

    List<ZoneSectorSummaryResponse> getZoneSectorSummary();

    List<ZoneUserResponse> getUsersByZone(Long zoneId);

    void checkAndCreateAlert(Long userId, Double emission);

    List<ZoneEmissionResponse> getZoneEmissions(); // ADD THIS
}