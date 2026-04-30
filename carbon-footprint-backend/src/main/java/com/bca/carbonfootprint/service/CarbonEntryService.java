package com.bca.carbonfootprint.service;

import java.util.List;
import java.util.Map;

import com.bca.carbonfootprint.dto.CarbonBreakdownResponse;
import com.bca.carbonfootprint.dto.CarbonEntryRequest;
import com.bca.carbonfootprint.dto.CarbonEntryResponse;
import com.bca.carbonfootprint.model.User;

public interface CarbonEntryService {

    CarbonEntryResponse addEntry(CarbonEntryRequest entry, User user);

    List<CarbonEntryResponse> getUserEntries(User user);

    Double getTotalCarbon(User user);

    Double getGreenScore(User user);

    List<CarbonBreakdownResponse> getCategoryBreakdown(User user);

    Double getMonthlyCarbon(User user, int year, int month);

    Map<String, Double> getYearlyTrend(User user, int year);

    Double estimateCarbon(com.bca.carbonfootprint.model.ActivityType type, double quantity);

    byte[] generateMonthlyCsv(User user, int year, int month);

    byte[] generateMonthlyPdf(User user, int year, int month);

    byte[] generateAdminMonthlyCsv(int year, int month);
}
