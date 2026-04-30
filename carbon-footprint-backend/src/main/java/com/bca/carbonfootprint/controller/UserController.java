package com.bca.carbonfootprint.controller;

import java.time.YearMonth;
import java.util.Comparator;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.bca.carbonfootprint.dto.ActionRecommendationResponse;
import com.bca.carbonfootprint.dto.CarbonBreakdownResponse;
import com.bca.carbonfootprint.dto.CommunityChallengeResponse;
import com.bca.carbonfootprint.dto.ChangePasswordRequest;
import com.bca.carbonfootprint.dto.EmissionPredictionResponse;
import com.bca.carbonfootprint.dto.GoalProgressResponse;
import com.bca.carbonfootprint.dto.GoalSettingsRequest;
import com.bca.carbonfootprint.dto.MissionResponse;
import com.bca.carbonfootprint.dto.RewardSummaryResponse;
import com.bca.carbonfootprint.dto.UserChatRequest;
import com.bca.carbonfootprint.dto.UserChatResponse;
import com.bca.carbonfootprint.dto.UserNotificationSummaryResponse;
import com.bca.carbonfootprint.dto.ZoneEmissionDTO;
import com.bca.carbonfootprint.dto.ZoneLeaderboardEntryResponse;
import com.bca.carbonfootprint.dto.ZoneLeaderboardResponse;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.repository.CarbonEntryRepository;
import com.bca.carbonfootprint.repository.UserRepository;
import com.bca.carbonfootprint.service.CarbonEntryService;
import com.bca.carbonfootprint.service.GoalTrackingService;
import com.bca.carbonfootprint.service.MissionService;
import com.bca.carbonfootprint.service.NotificationService;
import com.bca.carbonfootprint.service.PersonalCarbonAssistantService;
import com.bca.carbonfootprint.service.RewardService;
import com.bca.carbonfootprint.service.ZoneService;

@RestController
@RequestMapping("/api/user")
@CrossOrigin("*")
public class UserController {

    private static final double DEFAULT_ZONE_TARGET_MIN_KG = 250.0;
    private static final double DEFAULT_ZONE_TARGET_MAX_KG = 400.0;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CarbonEntryRepository carbonEntryRepository;

    @Autowired
    private CarbonEntryService carbonEntryService;

    @Autowired
    private MissionService missionService;

    @Autowired
    private RewardService rewardService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private PersonalCarbonAssistantService personalCarbonAssistantService;

    @Autowired
    private GoalTrackingService goalTrackingService;

    @Autowired
    private ZoneService zoneService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboard(Authentication authentication) {

        User user = getLoggedUser(authentication);
        LocalDate now = LocalDate.now();
        YearMonth currentMonth = YearMonth.of(now.getYear(), now.getMonthValue());
        YearMonth previousMonth = currentMonth.minusMonths(1);

        double monthly = safeValue(carbonEntryRepository.getMonthlyEmission(
                user.getId(),
                currentMonth.getMonthValue(),
                currentMonth.getYear()
        ));
        double today = safeValue(carbonEntryRepository.getTodayEmissionByUser(user.getId()));
        double previous = safeValue(carbonEntryRepository.getMonthlyEmission(
                user.getId(),
                previousMonth.getMonthValue(),
                previousMonth.getYear()
        ));
        double zoneAverage = getZoneAverage(user, currentMonth);
        int daysInMonth = currentMonth.lengthOfMonth();
        double dailyBudget = round((zoneAverage > 0 ? zoneAverage : 360) / daysInMonth);
        double remainingDailyBudget = round(Math.max(0, dailyBudget - today));
        int streakDays = getHealthyStreak(user.getId(), dailyBudget);
        double monthChangePct = previous > 0
                ? round(((monthly - previous) / previous) * 100)
                : 0;

        Map<String, Object> response = new HashMap<>();
        response.put("monthlyEmission", monthly);
        response.put("todayEmission", today);
        response.put("zoneAverage", zoneAverage);
        response.put("zoneName", user.getZone() != null ? user.getZone().getName() : "Unassigned");
        response.put("monthChangePct", monthChangePct);
        response.put("status", resolveStatus(monthly, zoneAverage));
        response.put("dailyBudget", dailyBudget);
        response.put("remainingDailyBudget", remainingDailyBudget);
        response.put("streakDays", streakDays);
        response.put("rewardPoints", rewardService.getTotalPoints(user.getId()));

        return response;
    }

    @GetMapping("/recommendations")
    public List<ActionRecommendationResponse> getRecommendations(Authentication authentication) {
        User user = getLoggedUser(authentication);
        return buildRecommendations(user);
    }

    @GetMapping("/emission-insights")
    public EmissionPredictionResponse getEmissionInsights(Authentication authentication) {
        User user = getLoggedUser(authentication);
        LocalDate now = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(now);

        double monthlyEmission = safeValue(carbonEntryRepository.getMonthlyEmission(
                user.getId(),
                currentMonth.getMonthValue(),
                currentMonth.getYear()
        ));

        int daysElapsed = now.getDayOfMonth();
        int daysInMonth = currentMonth.lengthOfMonth();
        int daysRemaining = Math.max(0, daysInMonth - daysElapsed);
        double zoneTargetMin = getZoneTargetMin(user);
        double zoneTargetMax = getZoneTargetMax(user);
        boolean zoneLimitConfigured = isZoneLimitConfigured(user);
        double projectedEmission = daysElapsed > 0
                ? round((monthlyEmission / daysElapsed) * daysInMonth)
                : 0;
        double remainingBudget = round(Math.max(0, zoneTargetMax - monthlyEmission));
        double usagePct = round((monthlyEmission / zoneTargetMax) * 100);
        double projectedUsagePct = round((projectedEmission / zoneTargetMax) * 100);
        String riskLevel = resolvePredictionRisk(monthlyEmission, projectedEmission, zoneTargetMax);
        String headline = buildInsightHeadline(riskLevel);
        String summary = buildInsightSummary(
                riskLevel,
                monthlyEmission,
                projectedEmission,
                remainingBudget,
                zoneTargetMin,
                zoneTargetMax,
                zoneLimitConfigured
        );

        return new EmissionPredictionResponse(
                user.getZone() != null ? user.getZone().getName() : "Unassigned",
                zoneTargetMin,
                zoneTargetMax,
                zoneLimitConfigured,
                monthlyEmission,
                projectedEmission,
                remainingBudget,
                usagePct,
                projectedUsagePct,
                daysElapsed,
                daysRemaining,
                riskLevel,
                headline,
                summary,
                buildRecommendations(user)
        );
    }

    @PostMapping("/assistant/chat")
    public UserChatResponse chatWithAssistant(
            @RequestBody UserChatRequest request,
            Authentication authentication
    ) {
        User user = getLoggedUser(authentication);
        String question = request != null && request.getMessage() != null
                ? request.getMessage().trim()
                : "";
        String normalizedQuestion = question.toLowerCase();

        LocalDate now = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(now);
        double monthlyEmission = safeValue(carbonEntryRepository.getMonthlyEmission(
                user.getId(),
                currentMonth.getMonthValue(),
                currentMonth.getYear()
        ));
        double todayEmission = safeValue(carbonEntryRepository.getTodayEmissionByUser(user.getId()));
        int daysElapsed = now.getDayOfMonth();
        int daysInMonth = currentMonth.lengthOfMonth();
        double projectedEmission = daysElapsed > 0
                ? round((monthlyEmission / daysElapsed) * daysInMonth)
                : 0;
        double zoneTargetMin = getZoneTargetMin(user);
        double zoneTargetMax = getZoneTargetMax(user);
        double remainingBudget = round(Math.max(0, zoneTargetMax - monthlyEmission));
        String riskLevel = resolvePredictionRisk(monthlyEmission, projectedEmission, zoneTargetMax);

        List<CarbonBreakdownResponse> breakdown = carbonEntryService.getCategoryBreakdown(user)
                .stream()
                .sorted(Comparator.comparingDouble(CarbonBreakdownResponse::getCarbonAmount).reversed())
                .toList();
        List<ActionRecommendationResponse> recommendations = buildRecommendations(user);

        CarbonBreakdownResponse topSource = breakdown.isEmpty() ? null : breakdown.get(0);
        ActionRecommendationResponse topRecommendation = recommendations.isEmpty() ? null : recommendations.get(0);

        if (isGreeting(normalizedQuestion)) {
            return new UserChatResponse(
                    "Hello! I'm Carbon Copilot. I can help with your profile, your zone limit, your biggest emission source, or the best carbon habit to improve this week.",
                    riskLevel,
                    buildAssistantInsights(monthlyEmission, projectedEmission, zoneTargetMax, topSource, topRecommendation),
                    List.of(
                            "Am I close to my zone limit?",
                            "What is my highest emission source?",
                            "What should I change this week?"
                    )
            );
        }

        String fallbackAnswer = buildAssistantAnswer(
                question,
                monthlyEmission,
                todayEmission,
                projectedEmission,
                zoneTargetMin,
                zoneTargetMax,
                remainingBudget,
                riskLevel,
                topSource,
                topRecommendation
        );
        String answer = personalCarbonAssistantService.generateAnswer(
                question,
                request != null ? request.getHistory() : List.of(),
                user,
                monthlyEmission,
                todayEmission,
                projectedEmission,
                zoneTargetMin,
                zoneTargetMax,
                remainingBudget,
                riskLevel,
                topSource,
                topRecommendation
        );

        if (answer == null || answer.isBlank()) {
            answer = fallbackAnswer;
        }

        return new UserChatResponse(
                answer,
                riskLevel,
                buildAssistantInsights(monthlyEmission, projectedEmission, zoneTargetMax, topSource, topRecommendation),
                buildFollowUpPrompts(question, topSource)
        );
    }

    @GetMapping("/challenge")
    public CommunityChallengeResponse getChallenge(Authentication authentication) {
        User user = getLoggedUser(authentication);
        YearMonth currentMonth = YearMonth.now();
        YearMonth previousMonth = currentMonth.minusMonths(1);

        double currentEmission = safeValue(carbonEntryRepository.getMonthlyEmission(
                user.getId(),
                currentMonth.getMonthValue(),
                currentMonth.getYear()
        ));
        double previousEmission = safeValue(carbonEntryRepository.getMonthlyEmission(
                user.getId(),
                previousMonth.getMonthValue(),
                previousMonth.getYear()
        ));
        List<CarbonBreakdownResponse> breakdown = carbonEntryService.getCategoryBreakdown(user)
                .stream()
                .sorted(Comparator.comparingDouble(CarbonBreakdownResponse::getCarbonAmount).reversed())
                .toList();

        // ✅ FIX: replaced breakdown.getFirst() with breakdown.get(0)
        String focusArea = breakdown.isEmpty()
                ? "your highest-impact habit"
                : formatActivity(breakdown.get(0).getActivityType());

        double goalReductionKg = Math.max(15, round(currentEmission * 0.12));
        double targetEmission = Math.max(0, round(currentEmission - goalReductionKg));
        double actualReduction = Math.max(0, previousEmission - currentEmission);
        double progressPct = goalReductionKg > 0
                ? Math.min(100, round((actualReduction / goalReductionKg) * 100))
                : 0;
        double improvementPct = previousEmission > 0
                ? round(((previousEmission - currentEmission) / previousEmission) * 100)
                : 0;

        int zoneRank = 0;
        int participants = 0;
        String zoneName = user.getZone() != null ? user.getZone().getName() : "Community";

        if (user.getZone() != null) {
            List<Object[]> leaderboard = carbonEntryRepository.getZoneLeaderboard(
                    user.getZone().getId(),
                    currentMonth.getMonthValue(),
                    currentMonth.getYear()
            );
            participants = leaderboard.size();
            for (int i = 0; i < leaderboard.size(); i++) {
                if (((Long) leaderboard.get(i)[0]).equals(user.getId())) {
                    zoneRank = i + 1;
                    break;
                }
            }
        }

        return new CommunityChallengeResponse(
                "This month's challenge: reduce " + focusArea,
                "Cut your current emission by " + goalReductionKg + " kg and help " + zoneName
                        + " improve its community score.",
                zoneName,
                goalReductionKg,
                currentEmission,
                targetEmission,
                progressPct,
                improvementPct,
                zoneRank,
                participants
        );
    }

    @GetMapping("/goals/progress")
    public GoalProgressResponse getGoalProgress(Authentication authentication) {
        User user = getLoggedUser(authentication);
        return goalTrackingService.getProgress(user);
    }

    @GetMapping("/zone-emissions")
    public List<ZoneEmissionDTO> getZoneEmissions(Authentication authentication) {
        getLoggedUser(authentication);
        List<ZoneEmissionDTO> zones = zoneService.getZoneEmissionSummary();
        zones.forEach(zone -> zone.setTotalUsers(userRepository.countByZone_Id(zone.getZoneId())));
        return zones;
    }

    @PutMapping("/goals/settings")
    public GoalProgressResponse updateGoalSettings(
            @RequestBody(required = false) GoalSettingsRequest request,
            Authentication authentication
    ) {
        User user = getLoggedUser(authentication);
        return goalTrackingService.updateSettings(user, request);
    }

    @PostMapping("/goals/send-weekly-summary")
    public Map<String, Object> sendGoalWeeklySummary(Authentication authentication) {
        User user = getLoggedUser(authentication);
        goalTrackingService.sendWeeklySummaryEmail(user);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "sent");
        response.put("message", "Weekly summary email has been sent.");
        return response;
    }

    @GetMapping("/missions/current")
    public MissionResponse getCurrentMission(Authentication authentication) {
        User user = getLoggedUser(authentication);
        return missionService.getCurrentMission(user);
    }

    @GetMapping("/rewards")
    public RewardSummaryResponse getRewards(Authentication authentication) {
        User user = getLoggedUser(authentication);
        return rewardService.getSummary(user);
    }

    @GetMapping("/notifications")
    public UserNotificationSummaryResponse getNotifications(Authentication authentication) {
        User user = getLoggedUser(authentication);
        return notificationService.getUserNotifications(user);
    }

    @PostMapping("/notifications/mark-all-read")
    public Map<String, Object> markAllNotificationsAsRead(Authentication authentication) {
        User user = getLoggedUser(authentication);
        int markedCount = notificationService.markAllAsRead(user);

        Map<String, Object> response = new HashMap<>();
        response.put("markedCount", markedCount);
        response.put("status", "ok");
        return response;
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changeUserPassword(
            @RequestBody ChangePasswordRequest request,
            Authentication authentication
    ) {
        if (request == null || request.getOldPassword() == null || request.getNewPassword() == null) {
            return ResponseEntity.badRequest().body("Old password and new password are required");
        }
        if (request.getNewPassword().length() < 6) {
            return ResponseEntity.badRequest().body("New password must be at least 6 characters");
        }
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Old password incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok("Password changed successfully");
    }

    @GetMapping("/leaderboard")
    public ZoneLeaderboardResponse getZoneLeaderboard(
            Authentication authentication,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        User user = getLoggedUser(authentication);
        int targetMonth = month != null ? month : LocalDate.now().getMonthValue();
        int targetYear = year != null ? year : LocalDate.now().getYear();

        if (user.getZone() == null) {
            return new ZoneLeaderboardResponse(
                    "Unassigned",
                    targetMonth,
                    targetYear,
                    null,
                    0,
                    List.of()
            );
        }

        List<Object[]> rows = carbonEntryRepository.getZoneLeaderboard(
                user.getZone().getId(),
                targetMonth,
                targetYear
        );

        List<ZoneLeaderboardEntryResponse> entries = IntStream.range(0, Math.min(rows.size(), 10))
                .mapToObj(index -> {
                    Object[] row = rows.get(index);
                    Long userId = (Long) row[0];
                    String name = (String) row[1];
                    double emission = safeValue((Double) row[2]);
                    int points = rewardService.getTotalPoints(userId);
                    boolean currentUser = userId.equals(user.getId());
                    return new ZoneLeaderboardEntryResponse(index + 1, userId, name, emission, points, currentUser);
                })
                .toList();

        // ✅ FIX: replaced entries.getFirst() with entries.get(0)
        String winnerName = entries.isEmpty() ? null : entries.get(0).getName();
        double winnerEmission = entries.isEmpty() ? 0 : entries.get(0).getMonthlyEmission();

        return new ZoneLeaderboardResponse(
                user.getZone().getName(),
                targetMonth,
                targetYear,
                winnerName,
                winnerEmission,
                entries
        );
    }

    private User getLoggedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private double getZoneAverage(User user, YearMonth month) {
        if (user.getZone() == null) {
            return 0;
        }

        long totalUsers = userRepository.countByZone_Id(user.getZone().getId());
        if (totalUsers == 0) {
            return 0;
        }

        double zoneTotal = safeValue(carbonEntryRepository.getZoneTotal(
                user.getZone().getId(),
                month.getMonthValue(),
                month.getYear()
        ));

        return round(zoneTotal / totalUsers);
    }

    private String resolveStatus(double monthly, double zoneAverage) {
        if (zoneAverage > 0) {
            if (monthly > zoneAverage * 1.15) {
                return "HIGH";
            }
            if (monthly < zoneAverage * 0.75) {
                return "LOW";
            }
        }
        return monthly > 500 ? "HIGH" : "NORMAL";
    }

    private int getHealthyStreak(Long userId, double dailyBudget) {
        LocalDate today = LocalDate.now();
        LocalDate lookbackStart = today.minusDays(89);

        Map<LocalDate, Double> dailyTotals = new HashMap<>();
        carbonEntryRepository.getDailyTotalsByUserAndDateRange(userId, lookbackStart, today)
                .forEach(row -> dailyTotals.put((LocalDate) row[0], safeValue((Double) row[1])));

        int streak = 0;
        LocalDate cursor = today;
        while (!cursor.isBefore(lookbackStart)) {
            if (!dailyTotals.containsKey(cursor)) {
                break;
            }
            if (dailyTotals.get(cursor) > dailyBudget) {
                break;
            }
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private List<ActionRecommendationResponse> buildRecommendations(User user) {
        List<CarbonBreakdownResponse> breakdown = carbonEntryService.getCategoryBreakdown(user)
                .stream()
                .sorted(Comparator.comparingDouble(CarbonBreakdownResponse::getCarbonAmount).reversed())
                .toList();

        if (breakdown.isEmpty()) {
            return List.of(
                    new ActionRecommendationResponse(
                            "GENERAL",
                            "Log your biggest weekly activities first",
                            "Start with electricity, transport, or fuel usage so the app can generate more accurate reduction plans.",
                            15,
                            "Low",
                            "Starter"
                    ),
                    new ActionRecommendationResponse(
                            "GENERAL",
                            "Set a weekly reduction target",
                            "Aim to reduce one repeat activity each week so progress is visible on your dashboard.",
                            20,
                            "Low",
                            "High"
                    )
            );
        }

        return breakdown.stream()
                .limit(3)
                .map(this::toRecommendation)
                .toList();
    }

    private String resolvePredictionRisk(double monthlyEmission, double projectedEmission, double zoneTargetMax) {
        double currentRatio = monthlyEmission / zoneTargetMax;
        double projectedRatio = projectedEmission / zoneTargetMax;

        if (currentRatio >= 1 || projectedRatio >= 1) {
            return "EXCEEDED";
        }
        if (currentRatio >= 0.85 || projectedRatio >= 0.9) {
            return "NEAR_LIMIT";
        }
        if (currentRatio >= 0.65 || projectedRatio >= 0.75) {
            return "WATCH";
        }
        return "SAFE";
    }

    private String buildInsightHeadline(String riskLevel) {
        return switch (riskLevel) {
            case "EXCEEDED" -> "You are projected to cross the monthly safe emission limit";
            case "NEAR_LIMIT" -> "You are getting close to the monthly emission limit";
            case "WATCH" -> "Your current trend needs a small correction";
            default -> "You are within the recommended monthly emission limit";
        };
    }

    private String buildInsightSummary(
            String riskLevel,
            double monthlyEmission,
            double projectedEmission,
            double remainingBudget,
            double zoneTargetMin,
            double zoneTargetMax,
            boolean zoneLimitConfigured
    ) {
        String zoneRangeLabel = round(zoneTargetMin) + " to " + round(zoneTargetMax) + " kg";
        String sourceLabel = zoneLimitConfigured ? "admin-set zone range" : "default zone range";

        return switch (riskLevel) {
            case "EXCEEDED" -> "At the current pace, you may finish around "
                    + round(projectedEmission) + " kg this month, above the " + sourceLabel
                    + " of " + zoneRangeLabel + ". Focus on your highest-impact habits now.";
            case "NEAR_LIMIT" -> "You have about " + remainingBudget
                    + " kg left before reaching the zone cap of " + round(zoneTargetMax)
                    + " kg. Small changes this week can keep you inside the preferred range.";
            case "WATCH" -> "You are at " + round(monthlyEmission)
                    + " kg so far. Your zone target range is " + zoneRangeLabel
                    + ", so a few lower-emission choices now can protect your month-end total.";
            default -> "You are tracking well at " + round(monthlyEmission)
                    + " kg this month. Stay within the " + sourceLabel + " of " + zoneRangeLabel + ".";
        };
    }

    private boolean isZoneLimitConfigured(User user) {
        return user.getZone() != null
                && user.getZone().getEmissionLimitMinKg() != null
                && user.getZone().getEmissionLimitMaxKg() != null;
    }

    private double getZoneTargetMin(User user) {
        if (user.getZone() == null || user.getZone().getEmissionLimitMinKg() == null) {
            return DEFAULT_ZONE_TARGET_MIN_KG;
        }
        return round(user.getZone().getEmissionLimitMinKg());
    }

    private double getZoneTargetMax(User user) {
        if (user.getZone() == null || user.getZone().getEmissionLimitMaxKg() == null) {
            return DEFAULT_ZONE_TARGET_MAX_KG;
        }
        return round(user.getZone().getEmissionLimitMaxKg());
    }

    private ActionRecommendationResponse toRecommendation(CarbonBreakdownResponse breakdown) {
        String activity = breakdown.getActivityType();
        double amount = breakdown.getCarbonAmount();

        return switch (activity) {
            case "ELECTRICITY" -> new ActionRecommendationResponse(
                    activity,
                    "Reduce idle electricity waste",
                    "Shift heavy appliance usage out of peak hours and switch off standby loads at night.",
                    round(amount * 0.15),
                    "Low",
                    "High"
            );
            case "CAR" -> new ActionRecommendationResponse(
                    activity,
                    "Replace short car trips",
                    "Convert a few weekly short-distance car trips to walking, cycling, or public transport.",
                    round(amount * 0.22),
                    "Medium",
                    "High"
            );
            case "DIESEL" -> new ActionRecommendationResponse(
                    activity,
                    "Optimize fuel-heavy travel",
                    "Batch errands into one trip and reduce unnecessary idling to cut liquid fuel usage.",
                    round(amount * 0.18),
                    "Medium",
                    "High"
            );
            case "AC" -> new ActionRecommendationResponse(
                    activity,
                    "Trim cooling hours",
                    "Raise thermostat settings slightly and reduce AC runtime during moderate weather windows.",
                    round(amount * 0.14),
                    "Low",
                    "Medium"
            );
            case "WASTE" -> new ActionRecommendationResponse(
                    activity,
                    "Separate and compost waste",
                    "Divert wet waste from landfill and reduce mixed disposal where possible.",
                    round(amount * 0.20),
                    "Medium",
                    "Medium"
            );
            default -> new ActionRecommendationResponse(
                    activity,
                    "Focus on " + formatActivity(activity),
                    "This category is one of your main contributors right now. Reducing it even slightly will move your monthly score.",
                    round(amount * 0.12),
                    "Medium",
                    "Medium"
            );
        };
    }

    private String buildAssistantAnswer(
            String question,
            double monthlyEmission,
            double todayEmission,
            double projectedEmission,
            double zoneTargetMin,
            double zoneTargetMax,
            double remainingBudget,
            String riskLevel,
            CarbonBreakdownResponse topSource,
            ActionRecommendationResponse topRecommendation
    ) {
        String normalized = question == null ? "" : question.toLowerCase();
        String topSourceLabel = topSource != null
                ? formatActivity(topSource.getActivityType()) + " at " + round(topSource.getCarbonAmount()) + " kg"
                : "your data is still too limited to isolate one main source";
        String topTip = topRecommendation != null
                ? topRecommendation.getTitle() + ": " + topRecommendation.getDescription()
                : "keep logging your weekly activities so I can give sharper suggestions";

        if (normalized.isBlank()) {
            return "Ask me about your carbon trend, zone limit, top emission source, or ways to reduce your footprint.";
        }

        if (isGreeting(normalized)) {
            return "Hi! I can help with your profile, today's emissions, your zone limit, or the best habit to improve this week. Ask me something like \"Am I close to my zone limit?\" or \"What should I change this week?\"";
        }

        if (containsAny(normalized, "limit", "range", "zone cap", "target")) {
            return "Your zone target range is " + round(zoneTargetMin) + " to " + round(zoneTargetMax)
                    + " kg for this month. You are currently at " + round(monthlyEmission) + " kg, so you have about "
                    + remainingBudget + " kg left before reaching the zone cap.";
        }

        if (containsAny(normalized, "high emitter", "am i high", "risk", "danger", "warning")) {
            return switch (riskLevel) {
                case "EXCEEDED" -> "You are currently above the safe zone cap. Your projected month-end total is "
                        + round(projectedEmission) + " kg, so you should act on your biggest source immediately.";
                case "NEAR_LIMIT" -> "You are not above the cap yet, but you are getting close. A small reduction now can help you stay inside your zone range.";
                case "WATCH" -> "You are still within range, but your current pattern needs attention so you do not drift toward the upper limit.";
                default -> "You are within the recommended zone range right now. Keep following your low-emission habits.";
            };
        }

        if (containsAny(normalized, "today", "daily", "budget")) {
            return "Today you have logged " + round(todayEmission) + " kg. For the month, you are at "
                    + round(monthlyEmission) + " kg, and your zone cap is " + round(zoneTargetMax)
                    + " kg, so staying light on repeat activities today will help.";
        }

        if (containsAny(normalized, "source", "highest", "most", "where", "category", "travel", "electricity", "car", "transport", "ac", "waste")) {
            return "Your highest-impact source right now is " + topSourceLabel + ". The best next action is: " + topTip;
        }

        if (containsAny(normalized, "reduce", "improve", "lower", "decrease", "save", "idea", "suggest")) {
            return "To reduce your footprint, start with " + topSourceLabel + ". My strongest suggestion for you is: "
                    + topTip + ". At your current pace, you are projected to reach " + round(projectedEmission)
                    + " kg this month.";
        }

        return "Here is your current picture: you have logged " + round(monthlyEmission)
                + " kg this month and are projected to reach " + round(projectedEmission)
                + " kg. Your zone target range is " + round(zoneTargetMin) + " to " + round(zoneTargetMax)
                + " kg. Your main focus area is " + topSourceLabel + ".";
    }

    private List<String> buildAssistantInsights(
            double monthlyEmission,
            double projectedEmission,
            double zoneTargetMax,
            CarbonBreakdownResponse topSource,
            ActionRecommendationResponse topRecommendation
    ) {
        String topSourceInsight = topSource != null
                ? "Top source: " + formatActivity(topSource.getActivityType()) + " (" + round(topSource.getCarbonAmount()) + " kg)"
                : "Top source: log more entries to unlock category-specific insight";
        String tipInsight = topRecommendation != null
                ? "Best next action: " + topRecommendation.getTitle()
                : "Best next action: keep logging your main activities";

        return List.of(
                "This month: " + round(monthlyEmission) + " kg",
                "Projected month-end: " + round(projectedEmission) + " kg",
                "Zone cap: " + round(zoneTargetMax) + " kg",
                topSourceInsight,
                tipInsight
        );
    }

    private List<String> buildFollowUpPrompts(String question, CarbonBreakdownResponse topSource) {
        String activityPrompt = topSource != null
                ? "How can I reduce " + formatActivity(topSource.getActivityType()) + " emissions?"
                : "How should I start reducing my carbon footprint?";

        if (question != null && isGreeting(question.toLowerCase())) {
            return List.of(
                    "Am I close to my zone limit?",
                    "What is my highest emission source?",
                    "What should I change this week?"
            );
        }

        if (question != null && question.toLowerCase().contains("limit")) {
            return List.of(
                    activityPrompt,
                    "Am I close to becoming a high emitter?",
                    "What should I change this week?"
            );
        }

        return List.of(
                "What is my highest emission source?",
                "How can I stay inside my zone limit?",
                activityPrompt
        );
    }

    private boolean isGreeting(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase();
        return normalized.equals("hi")
                || normalized.equals("hello")
                || normalized.equals("hey")
                || normalized.equals("hii")
                || normalized.equals("hiii")
                || normalized.equals("good morning")
                || normalized.equals("good afternoon")
                || normalized.equals("good evening");
    }

    private boolean containsAny(String value, String... candidates) {
        for (String candidate : candidates) {
            if (value.contains(candidate)) {
                return true;
            }
        }
        return false;
    }

    private String formatActivity(String activityType) {
        return activityType.toLowerCase().replace('_', ' ');
    }

    private double safeValue(Double value) {
        return value != null ? value : 0;
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
