package com.bca.carbonfootprint.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bca.carbonfootprint.model.Zone;
import com.bca.carbonfootprint.repository.CarbonEntryRepository;
import com.bca.carbonfootprint.repository.UserRepository;
import com.bca.carbonfootprint.repository.ZoneRepository;

@Service
public class AdminIntelligenceService {

    private static final double DEFAULT_ZONE_LIMIT_MIN_KG = 250.0;
    private static final double DEFAULT_ZONE_LIMIT_MAX_KG = 400.0;

    @Autowired
    private ZoneRepository zoneRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CarbonEntryRepository carbonEntryRepository;

    public Map<String, Object> getZoneIntelligence() {
        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(today);
        int daysElapsed = today.getDayOfMonth();
        int daysInMonth = currentMonth.lengthOfMonth();

        List<Map<String, Object>> zones = new ArrayList<>();

        for (Zone zone : zoneRepository.findAll()) {
            long totalUsers = userRepository.countByZone_Id(zone.getId());
            double monthlyEmission = safe(carbonEntryRepository.getZoneTotal(
                    zone.getId(),
                    currentMonth.getMonthValue(),
                    currentMonth.getYear()
            ));

            YearMonth previousMonth = currentMonth.minusMonths(1);
            double previousEmission = safe(carbonEntryRepository.getZoneTotal(
                    zone.getId(),
                    previousMonth.getMonthValue(),
                    previousMonth.getYear()
            ));

            double limitMinKg = zone.getEmissionLimitMinKg() != null
                    ? zone.getEmissionLimitMinKg()
                    : DEFAULT_ZONE_LIMIT_MIN_KG;
            double limitMaxKg = zone.getEmissionLimitMaxKg() != null
                    ? zone.getEmissionLimitMaxKg()
                    : DEFAULT_ZONE_LIMIT_MAX_KG;

            double zoneCapacityKg = totalUsers * limitMaxKg;
            double projectedMonthEnd = daysElapsed > 0
                    ? round((monthlyEmission / daysElapsed) * daysInMonth)
                    : 0;
            double utilizationPct = zoneCapacityKg > 0
                    ? round((projectedMonthEnd / zoneCapacityKg) * 100)
                    : 0;
            double trendPct = previousEmission > 0
                    ? round(((projectedMonthEnd - previousEmission) / previousEmission) * 100)
                    : 0;
            double nextMonthForecast = round(Math.max(0, projectedMonthEnd + ((projectedMonthEnd - previousEmission) * 0.35)));
            String riskLevel = resolveRisk(utilizationPct);

            Map<String, Object> zoneData = new LinkedHashMap<>();
            zoneData.put("zoneId", zone.getId());
            zoneData.put("zoneName", zone.getName());
            zoneData.put("totalUsers", totalUsers);
            zoneData.put("monthlyEmission", round(monthlyEmission));
            zoneData.put("projectedMonthEnd", projectedMonthEnd);
            zoneData.put("nextMonthForecast", nextMonthForecast);
            zoneData.put("averageEmissionPerUser", totalUsers > 0 ? round(projectedMonthEnd / totalUsers) : 0.0);
            zoneData.put("limitMinKg", round(limitMinKg));
            zoneData.put("limitMaxKg", round(limitMaxKg));
            zoneData.put("zoneCapacityKg", round(zoneCapacityKg));
            zoneData.put("utilizationPct", utilizationPct);
            zoneData.put("trendPct", trendPct);
            zoneData.put("riskLevel", riskLevel);
            zoneData.put("recommendation", buildRecommendation(zone.getName(), riskLevel, trendPct));
            zones.add(zoneData);
        }

        zones.sort(Comparator.comparingDouble(item -> -asDouble(item.get("utilizationPct"))));

        List<Map<String, Object>> historicalTrend = buildHistoricalTrend(currentMonth);
        Map<String, Object> summary = buildSummary(zones);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("generatedAt", java.time.LocalDateTime.now());
        response.put("zones", zones);
        response.put("historicalTrend", historicalTrend);
        response.put("summary", summary);
        response.put("headlines", buildHeadlines(zones, summary));
        return response;
    }

    private List<Map<String, Object>> buildHistoricalTrend(YearMonth currentMonth) {
        List<Map<String, Object>> trend = new ArrayList<>();

        for (int offset = 5; offset >= 0; offset--) {
            YearMonth month = currentMonth.minusMonths(offset);
            double monthlyTotal = 0;

            for (Zone zone : zoneRepository.findAll()) {
                monthlyTotal += safe(carbonEntryRepository.getZoneTotal(
                        zone.getId(),
                        month.getMonthValue(),
                        month.getYear()
                ));
            }

            Map<String, Object> point = new LinkedHashMap<>();
            point.put("month", month.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            point.put("emission", round(monthlyTotal));
            trend.add(point);
        }

        return trend;
    }

    private Map<String, Object> buildSummary(List<Map<String, Object>> zones) {
        Map<String, Object> summary = new LinkedHashMap<>();

        Map<String, Object> highestRiskZone = zones.isEmpty() ? null : zones.get(0);
        Map<String, Object> calmestZone = zones.stream()
                .filter(zone -> asDouble(zone.get("zoneCapacityKg")) > 0)
                .min(Comparator.comparingDouble(zone -> asDouble(zone.get("utilizationPct"))))
                .orElse(null);

        long overloadedZones = zones.stream()
                .filter(zone -> {
                    String riskLevel = String.valueOf(zone.get("riskLevel"));
                    return "NEAR_LIMIT".equals(riskLevel) || "EXCEEDED".equals(riskLevel);
                })
                .count();

        long nextMonthPressureZones = zones.stream()
                .filter(zone -> asDouble(zone.get("nextMonthForecast")) > asDouble(zone.get("zoneCapacityKg")))
                .count();

        double averageUtilizationPct = zones.stream()
                .mapToDouble(zone -> asDouble(zone.get("utilizationPct")))
                .average()
                .orElse(0);

        summary.put("highestRiskZone", highestRiskZone != null ? highestRiskZone.get("zoneName") : "No zone");
        summary.put("highestRiskUtilizationPct", highestRiskZone != null ? highestRiskZone.get("utilizationPct") : 0.0);
        summary.put("calmestZone", calmestZone != null ? calmestZone.get("zoneName") : "No zone");
        summary.put("overloadedZones", overloadedZones);
        summary.put("nextMonthPressureZones", nextMonthPressureZones);
        summary.put("averageUtilizationPct", round(averageUtilizationPct));
        return summary;
    }

    private List<String> buildHeadlines(List<Map<String, Object>> zones, Map<String, Object> summary) {
        String highestRiskZone = String.valueOf(summary.get("highestRiskZone"));
        double highestRiskPct = asDouble(summary.get("highestRiskUtilizationPct"));
        long nextMonthPressureZones = Math.round(asDouble(summary.get("nextMonthPressureZones")));
        String calmestZone = String.valueOf(summary.get("calmestZone"));

        List<String> headlines = new ArrayList<>();
        headlines.add(highestRiskZone + " is carrying the highest projected zone pressure at " + highestRiskPct + "% of its capacity.");
        headlines.add(nextMonthPressureZones + " zone(s) are on track to stay above their safe balance next month if the current pace continues.");
        headlines.add(calmestZone + " is the most balanced zone right now and can be used as the benchmark for admin interventions.");

        if (!zones.isEmpty()) {
            Map<String, Object> topZone = zones.get(0);
            headlines.add(String.valueOf(topZone.get("recommendation")));
        }

        return headlines;
    }

    private String resolveRisk(double utilizationPct) {
        if (utilizationPct >= 100) {
            return "EXCEEDED";
        }
        if (utilizationPct >= 85) {
            return "NEAR_LIMIT";
        }
        if (utilizationPct >= 65) {
            return "WATCH";
        }
        return "SAFE";
    }

    private String buildRecommendation(String zoneName, String riskLevel, double trendPct) {
        return switch (riskLevel) {
            case "EXCEEDED" -> zoneName + " needs immediate admin action: tighten user outreach, enforce reminders, and review its highest emitters this week.";
            case "NEAR_LIMIT" -> zoneName + " is close to the border. Push reminder emails and highlight AI reduction tips before more users cross the cap.";
            case "WATCH" -> trendPct > 0
                    ? zoneName + " is rising steadily. Watch transport and electricity-heavy users before the zone drifts into red."
                    : zoneName + " is stable but still needs moderate monitoring to keep users inside the safe range.";
            default -> zoneName + " is currently balanced. Use it as a healthy baseline when comparing admin interventions across zones.";
        };
    }

    private double safe(Double value) {
        return value != null ? value : 0;
    }

    private double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return 0;
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
