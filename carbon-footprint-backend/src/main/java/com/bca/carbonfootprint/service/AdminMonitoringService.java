package com.bca.carbonfootprint.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.bca.carbonfootprint.dto.AdminLiveFeedItemResponse;
import com.bca.carbonfootprint.dto.AdminLiveMonitorResponse;
import com.bca.carbonfootprint.model.AdminActivityLog;
import com.bca.carbonfootprint.model.EnvironmentalIssue;
import com.bca.carbonfootprint.model.Zone;
import com.bca.carbonfootprint.repository.AdminActivityLogRepository;
import com.bca.carbonfootprint.repository.CarbonEntryRepository;
import com.bca.carbonfootprint.repository.EnvironmentalIssueRepository;
import com.bca.carbonfootprint.repository.ZoneRepository;

@Service
public class AdminMonitoringService {

    private static final double DEFAULT_ZONE_MONTHLY_CAP = 400.0;

    @Autowired
    private CarbonEntryRepository carbonEntryRepository;

    @Autowired
    private ZoneRepository zoneRepository;

    @Autowired
    private AdminActivityLogRepository adminActivityLogRepository;

    @Autowired
    private EnvironmentalIssueRepository environmentalIssueRepository;

    public AdminLiveMonitorResponse getLiveMonitorSnapshot() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        long entriesLastHour = carbonEntryRepository.countEntriesSince(now.minusHours(1));
        long activeUsersNow = carbonEntryRepository.countDistinctUsersSince(now.minusMinutes(30));

        double todayEmission = safeValue(carbonEntryRepository.getTotalCarbonByDate(today));
        double yesterdayEmission = safeValue(carbonEntryRepository.getTotalCarbonByDate(yesterday));
        double emissionChangePct = yesterdayEmission > 0
                ? round(((todayEmission - yesterdayEmission) / yesterdayEmission) * 100)
                : (todayEmission > 0 ? 100.0 : 0.0);

        ZoneThresholdResult thresholdResult = resolveZoneThresholds(today, now);
        List<AdminLiveFeedItemResponse> feed = buildActivityFeed(thresholdResult.alertEvents, now);

        return new AdminLiveMonitorResponse(
                activeUsersNow,
                entriesLastHour,
                emissionChangePct,
                thresholdResult.exceededCount,
                now,
                feed
        );
    }

    private ZoneThresholdResult resolveZoneThresholds(LocalDate today, LocalDateTime now) {
        List<Object[]> zoneDailyRows = carbonEntryRepository.getZoneDailyTotals(today);
        Map<Long, ZoneDailyTotal> totalsByZoneId = new HashMap<>();
        for (Object[] row : zoneDailyRows) {
            Long zoneId = (Long) row[0];
            double total = safeValue((Double) row[2]);
            totalsByZoneId.put(zoneId, new ZoneDailyTotal(total));
        }

        YearMonth month = YearMonth.from(today);
        List<AdminLiveFeedItemResponse> alerts = new ArrayList<>();
        int exceededCount = 0;

        for (Zone zone : zoneRepository.findAll()) {
            ZoneDailyTotal daily = totalsByZoneId.get(zone.getId());
            if (daily == null) {
                continue;
            }

            double monthlyCap = zone.getEmissionLimitMaxKg() != null
                    ? zone.getEmissionLimitMaxKg()
                    : DEFAULT_ZONE_MONTHLY_CAP;
            double dailyThreshold = round(monthlyCap / month.lengthOfMonth());
            if (daily.totalEmission > dailyThreshold) {
                exceededCount++;
                alerts.add(new AdminLiveFeedItemResponse(
                        "zone-threshold-" + zone.getId() + "-" + today,
                        "ZONE_ALERT",
                        "HIGH",
                        "Alert: " + zone.getName() + " crossed " + dailyThreshold + "kg daily limit.",
                        now.minusMinutes(exceededCount * 2L)
                ));
            }
        }

        return new ZoneThresholdResult(exceededCount, alerts);
    }

    private List<AdminLiveFeedItemResponse> buildActivityFeed(
            List<AdminLiveFeedItemResponse> zoneAlerts,
            LocalDateTime now
    ) {
        List<AdminLiveFeedItemResponse> feed = new ArrayList<>();

        List<Object[]> entryRows = carbonEntryRepository.findRecentEntryActivity(PageRequest.of(0, 8));
        for (Object[] row : entryRows) {
            Long entryId = (Long) row[0];
            String userName = (String) row[1];
            double carbonAmount = safeValue((Double) row[2]);
            String activityType = row[3] != null ? row[3].toString() : "Activity";
            LocalDateTime createdAt = (LocalDateTime) row[4];

            feed.add(new AdminLiveFeedItemResponse(
                    "entry-" + entryId,
                    "ENTRY",
                    "INFO",
                    userName + " added " + round(carbonAmount) + "kg CO₂ (" + formatActivity(activityType) + ").",
                    createdAt != null ? createdAt : now
            ));
        }

        List<AdminActivityLog> adminLogs = adminActivityLogRepository.findTop20ByOrderByCreatedAtDesc();
        adminLogs.stream()
                .limit(6)
                .forEach(log -> feed.add(new AdminLiveFeedItemResponse(
                        "admin-" + log.getId(),
                        "ADMIN_ACTION",
                        "MEDIUM",
                        log.getDescription(),
                        log.getCreatedAt()
                )));

        feed.addAll(zoneAlerts);

        List<EnvironmentalIssue> recentIssues = environmentalIssueRepository.findTop20ByOrderByReportedAtDesc();
        recentIssues.stream()
                .limit(6)
                .forEach(issue -> feed.add(new AdminLiveFeedItemResponse(
                        "issue-" + issue.getId(),
                        "COMPLAINT",
                        resolveComplaintSeverity(issue),
                        issue.getTitle() + " [" + resolveZoneName(issue) + "]",
                        issue.getReportedAt() != null ? issue.getReportedAt() : now
                )));

        return feed.stream()
                .sorted(Comparator.comparing(AdminLiveFeedItemResponse::getCreatedAt).reversed())
                .limit(20)
                .toList();
    }

    private String formatActivity(String value) {
        return value.toLowerCase().replace('_', ' ');
    }

    private String resolveComplaintSeverity(EnvironmentalIssue issue) {
        if (issue.getAiPriority() != null) {
            return switch (issue.getAiPriority().toUpperCase()) {
                case "CRITICAL", "HIGH" -> "HIGH";
                case "MEDIUM" -> "MEDIUM";
                default -> "INFO";
            };
        }
        return issue.getSeverity() >= 4 ? "HIGH" : issue.getSeverity() >= 3 ? "MEDIUM" : "INFO";
    }

    private String resolveZoneName(EnvironmentalIssue issue) {
        if (issue.getMappedZoneName() != null && !issue.getMappedZoneName().isBlank()) {
            return issue.getMappedZoneName();
        }
        return issue.getReporter() != null && issue.getReporter().getZone() != null
                ? issue.getReporter().getZone().getName()
                : "Unassigned";
    }

    private double safeValue(Double value) {
        return value != null ? value : 0;
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private static class ZoneDailyTotal {
        private final double totalEmission;

        private ZoneDailyTotal(double totalEmission) {
            this.totalEmission = totalEmission;
        }
    }

    private static class ZoneThresholdResult {
        private final int exceededCount;
        private final List<AdminLiveFeedItemResponse> alertEvents;

        private ZoneThresholdResult(int exceededCount, List<AdminLiveFeedItemResponse> alertEvents) {
            this.exceededCount = exceededCount;
            this.alertEvents = alertEvents;
        }
    }
}
