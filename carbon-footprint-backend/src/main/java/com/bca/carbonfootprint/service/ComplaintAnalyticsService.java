package com.bca.carbonfootprint.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Predicate;

import org.springframework.stereotype.Service;

import com.bca.carbonfootprint.model.EnvironmentalIssue;
import com.bca.carbonfootprint.model.IssueStatus;
import com.bca.carbonfootprint.model.IssueType;
import com.bca.carbonfootprint.model.Zone;
import com.bca.carbonfootprint.repository.EnvironmentalIssueRepository;
import com.bca.carbonfootprint.repository.ZoneRepository;

@Service
public class ComplaintAnalyticsService {

    private final EnvironmentalIssueRepository environmentalIssueRepository;
    private final ZoneRepository zoneRepository;

    public ComplaintAnalyticsService(
            EnvironmentalIssueRepository environmentalIssueRepository,
            ZoneRepository zoneRepository) {
        this.environmentalIssueRepository = environmentalIssueRepository;
        this.zoneRepository = zoneRepository;
    }

    public Map<String, Object> getComplaintAnalytics() {
        List<EnvironmentalIssue> issues = environmentalIssueRepository.findAllByOrderByReportedAtDesc();
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(6);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("generatedAt", LocalDateTime.now());
        response.put("summary", buildSummary(issues));
        response.put("zoneAnalytics", buildZoneAnalytics(issues));
        response.put("trend", buildTrend(issues, sevenDaysAgo));
        response.put("topPollutedZones", buildTopZones(issues, issue -> issue.getIssueType() == IssueType.AIR_POLLUTION));
        response.put("frequentlyUncleanRoads", buildTopZones(issues, issue -> issue.getIssueType() == IssueType.WASTE_DUMPING));
        response.put("repeatedOffenders", buildRepeatedOffenders(issues));
        return response;
    }

    private Map<String, Object> buildSummary(List<EnvironmentalIssue> issues) {
        long openComplaints = issues.stream()
                .filter(issue -> !isTerminal(issue))
                .count();

        long criticalComplaints = issues.stream()
                .filter(issue -> isPriority(issue, "HIGH", "CRITICAL"))
                .count();

        long vehicleEmissionReports = issues.stream()
                .filter(issue -> issue.getIssueType() == IssueType.AIR_POLLUTION)
                .count();

        long wasteReports = issues.stream()
                .filter(issue -> issue.getIssueType() == IssueType.WASTE_DUMPING)
                .count();

        long repeatedOffenderCount = buildRepeatedOffenders(issues).size();
        double averageConfidenceScore = round(issues.stream()
                .map(EnvironmentalIssue::getAiConfidenceScore)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0));

        String mostImpactedZone = buildZoneAnalytics(issues).stream()
                .max(Comparator.comparingDouble(zone -> asDouble(zone.get("hotspotIndex"))))
                .map(zone -> String.valueOf(zone.get("zoneName")))
                .orElse("Unassigned");

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalComplaints", issues.size());
        summary.put("openComplaints", openComplaints);
        summary.put("criticalComplaints", criticalComplaints);
        summary.put("vehicleEmissionReports", vehicleEmissionReports);
        summary.put("garbageReports", wasteReports);
        summary.put("repeatedOffenderCount", repeatedOffenderCount);
        summary.put("averageConfidenceScore", averageConfidenceScore);
        summary.put("mostImpactedZone", mostImpactedZone);
        return summary;
    }

    private List<Map<String, Object>> buildZoneAnalytics(List<EnvironmentalIssue> issues) {
        Map<String, List<EnvironmentalIssue>> issuesByZone = new LinkedHashMap<>();

        for (Zone zone : zoneRepository.findAll()) {
            issuesByZone.put(zone.getName(), new ArrayList<>());
        }
        issuesByZone.putIfAbsent("Unassigned", new ArrayList<>());

        for (EnvironmentalIssue issue : issues) {
            String zoneName = resolveZoneName(issue);
            issuesByZone.computeIfAbsent(zoneName, key -> new ArrayList<>()).add(issue);
        }

        return issuesByZone.entrySet().stream()
                .map(entry -> {
                    List<EnvironmentalIssue> zoneIssues = entry.getValue();
                    long openCount = zoneIssues.stream().filter(issue -> !isTerminal(issue)).count();
                    long airPollutionCount = zoneIssues.stream().filter(issue -> issue.getIssueType() == IssueType.AIR_POLLUTION).count();
                    long garbageCount = zoneIssues.stream().filter(issue -> issue.getIssueType() == IssueType.WASTE_DUMPING).count();
                    double avgScore = round(zoneIssues.stream()
                            .map(EnvironmentalIssue::getAiScore)
                            .filter(Objects::nonNull)
                            .mapToDouble(Double::doubleValue)
                            .average()
                            .orElse(zoneIssues.stream().mapToInt(EnvironmentalIssue::getSeverity).average().orElse(0) * 20));
                    double avgConfidence = round(zoneIssues.stream()
                            .map(EnvironmentalIssue::getAiConfidenceScore)
                            .filter(Objects::nonNull)
                            .mapToDouble(Double::doubleValue)
                            .average()
                            .orElse(0));
                    double hotspotIndex = round((openCount * 14) + (airPollutionCount * 11) + (garbageCount * 9) + avgScore);

                    Map<String, Object> zoneData = new LinkedHashMap<>();
                    zoneData.put("zoneName", entry.getKey());
                    zoneData.put("complaintCount", zoneIssues.size());
                    zoneData.put("openCount", openCount);
                    zoneData.put("airPollutionCount", airPollutionCount);
                    zoneData.put("garbageCount", garbageCount);
                    zoneData.put("averageScore", avgScore);
                    zoneData.put("averageConfidenceScore", avgConfidence);
                    zoneData.put("hotspotIndex", hotspotIndex);
                    zoneData.put("criticalCount", zoneIssues.stream().filter(issue -> isPriority(issue, "HIGH", "CRITICAL")).count());
                    return zoneData;
                })
                .sorted(Comparator.comparingDouble(zone -> -asDouble(zone.get("hotspotIndex"))))
                .toList();
    }

    private List<Map<String, Object>> buildTrend(List<EnvironmentalIssue> issues, LocalDateTime since) {
        Map<LocalDate, List<EnvironmentalIssue>> issuesByDate = new LinkedHashMap<>();
        for (int offset = 6; offset >= 0; offset--) {
            issuesByDate.put(LocalDate.now().minusDays(offset), new ArrayList<>());
        }

        issues.stream()
                .filter(issue -> issue.getReportedAt() != null && issue.getReportedAt().isAfter(since))
                .forEach(issue -> issuesByDate.computeIfAbsent(issue.getReportedAt().toLocalDate(), key -> new ArrayList<>()).add(issue));

        return issuesByDate.entrySet().stream()
                .map(entry -> {
                    List<EnvironmentalIssue> dailyIssues = entry.getValue();
                    Map<String, Object> point = new LinkedHashMap<>();
                    point.put("day", entry.getKey().getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                    point.put("date", entry.getKey());
                    point.put("complaints", dailyIssues.size());
                    point.put("averageScore", round(dailyIssues.stream()
                            .map(EnvironmentalIssue::getAiScore)
                            .filter(Objects::nonNull)
                            .mapToDouble(Double::doubleValue)
                            .average()
                            .orElse(0)));
                    return point;
                })
                .toList();
    }

    private List<Map<String, Object>> buildTopZones(
            List<EnvironmentalIssue> issues,
            Predicate<EnvironmentalIssue> filter) {
        Map<String, List<EnvironmentalIssue>> grouped = new LinkedHashMap<>();

        issues.stream()
                .filter(filter)
                .forEach(issue -> grouped.computeIfAbsent(resolveZoneName(issue), key -> new ArrayList<>()).add(issue));

        return grouped.entrySet().stream()
                .map(entry -> {
                    List<EnvironmentalIssue> zoneIssues = entry.getValue();
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("zoneName", entry.getKey());
                    item.put("complaintCount", zoneIssues.size());
                    item.put("averageScore", round(zoneIssues.stream()
                            .map(EnvironmentalIssue::getAiScore)
                            .filter(Objects::nonNull)
                            .mapToDouble(Double::doubleValue)
                            .average()
                            .orElse(zoneIssues.stream().mapToInt(EnvironmentalIssue::getSeverity).average().orElse(0) * 20)));
                    item.put("averageConfidenceScore", round(zoneIssues.stream()
                            .map(EnvironmentalIssue::getAiConfidenceScore)
                            .filter(Objects::nonNull)
                            .mapToDouble(Double::doubleValue)
                            .average()
                            .orElse(0)));
                    item.put("openCount", zoneIssues.stream().filter(issue -> !isTerminal(issue)).count());
                    return item;
                })
                .sorted(Comparator.comparingDouble(item -> -asDouble(item.get("averageScore"))))
                .limit(5)
                .toList();
    }

    private List<Map<String, Object>> buildRepeatedOffenders(List<EnvironmentalIssue> issues) {
        Map<String, List<EnvironmentalIssue>> grouped = new LinkedHashMap<>();

        issues.stream()
                .filter(issue -> issue.getVehiclePlateNumber() != null && !issue.getVehiclePlateNumber().isBlank())
                .forEach(issue -> grouped.computeIfAbsent(issue.getVehiclePlateNumber().trim().toUpperCase(), key -> new ArrayList<>()).add(issue));

        return grouped.entrySet().stream()
                .filter(entry -> entry.getValue().size() > 1)
                .map(entry -> {
                    List<EnvironmentalIssue> offenderIssues = entry.getValue();
                    EnvironmentalIssue latest = offenderIssues.stream()
                            .max(Comparator.comparing(EnvironmentalIssue::getReportedAt))
                            .orElse(offenderIssues.get(0));

                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("vehiclePlateNumber", entry.getKey());
                    item.put("count", offenderIssues.size());
                    item.put("latestZone", resolveZoneName(latest));
                    item.put("averageScore", round(offenderIssues.stream()
                            .map(EnvironmentalIssue::getAiScore)
                            .filter(Objects::nonNull)
                            .mapToDouble(Double::doubleValue)
                            .average()
                            .orElse(offenderIssues.stream().mapToInt(EnvironmentalIssue::getSeverity).average().orElse(0) * 20)));
                    item.put("averageConfidenceScore", round(offenderIssues.stream()
                            .map(EnvironmentalIssue::getAiConfidenceScore)
                            .filter(Objects::nonNull)
                            .mapToDouble(Double::doubleValue)
                            .average()
                            .orElse(0)));
                    item.put("lastReportedAt", latest.getReportedAt());
                    return item;
                })
                .sorted(Comparator.comparingDouble(item -> -asDouble(item.get("averageScore"))))
                .limit(8)
                .toList();
    }

    private String resolveZoneName(EnvironmentalIssue issue) {
        if (issue.getMappedZoneName() != null && !issue.getMappedZoneName().isBlank()) {
            return issue.getMappedZoneName();
        }
        if (issue.getReporter() != null && issue.getReporter().getZone() != null) {
            return issue.getReporter().getZone().getName();
        }
        return "Unassigned";
    }

    private boolean isPriority(EnvironmentalIssue issue, String... priorities) {
        if (issue.getAiPriority() == null) {
            return issue.getSeverity() >= 4;
        }
        for (String priority : priorities) {
            if (priority.equalsIgnoreCase(issue.getAiPriority())) {
                return true;
            }
        }
        return false;
    }

    private double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return 0;
    }

    private boolean isTerminal(EnvironmentalIssue issue) {
        return issue.getStatus() == IssueStatus.ACTION_TAKEN
                || issue.getStatus() == IssueStatus.REJECTED
                || issue.getStatus() == IssueStatus.RESOLVED;
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
