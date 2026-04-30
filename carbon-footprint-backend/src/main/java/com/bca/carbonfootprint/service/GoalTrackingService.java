package com.bca.carbonfootprint.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.bca.carbonfootprint.dto.GoalMilestoneResponse;
import com.bca.carbonfootprint.dto.GoalProgressResponse;
import com.bca.carbonfootprint.dto.GoalSettingsRequest;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.model.UserMonthlyGoal;
import com.bca.carbonfootprint.repository.CarbonEntryRepository;
import com.bca.carbonfootprint.repository.UserMonthlyGoalRepository;
import com.bca.carbonfootprint.repository.UserRepository;

@Service
public class GoalTrackingService {

    private static final Logger logger = LoggerFactory.getLogger(GoalTrackingService.class);

    private static final double DEFAULT_TARGET_REDUCTION_PCT = 20.0;
    private static final double MIN_TARGET_REDUCTION_PCT = 5.0;
    private static final double MAX_TARGET_REDUCTION_PCT = 60.0;
    private static final double BASELINE_FALLBACK_KG = 200.0;
    private static final double CARBON_NEUTRAL_WEEK_CAP_KG = 7.0;

    @Autowired
    private UserMonthlyGoalRepository userMonthlyGoalRepository;

    @Autowired
    private CarbonEntryRepository carbonEntryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    public GoalProgressResponse getProgress(User user) {
        YearMonth currentMonth = YearMonth.now();
        UserMonthlyGoal goal = getOrCreateGoal(user, currentMonth);
        return buildProgress(user, goal, currentMonth);
    }

    public GoalProgressResponse updateSettings(User user, GoalSettingsRequest request) {
        YearMonth currentMonth = YearMonth.now();
        UserMonthlyGoal goal = getOrCreateGoal(user, currentMonth);

        if (request != null) {
            if (request.getTargetReductionPct() != null) {
                double sanitizedTarget = clamp(
                        request.getTargetReductionPct(),
                        MIN_TARGET_REDUCTION_PCT,
                        MAX_TARGET_REDUCTION_PCT
                );
                goal.setTargetReductionPct(round(sanitizedTarget));
            }
            if (request.getWeeklySummaryEnabled() != null) {
                goal.setWeeklySummaryEnabled(request.getWeeklySummaryEnabled());
            }
        }

        userMonthlyGoalRepository.save(goal);
        return buildProgress(user, goal, currentMonth);
    }

    public void sendWeeklySummaryEmail(User user) {
        YearMonth currentMonth = YearMonth.now();
        UserMonthlyGoal goal = getOrCreateGoal(user, currentMonth);
        GoalProgressResponse progress = buildProgress(user, goal, currentMonth);
        String weekKey = getWeekKey(LocalDate.now());

        sendWeeklySummaryEmailInternal(user, progress, weekKey);
        goal.setLastSummaryWeekKey(weekKey);
        userMonthlyGoalRepository.save(goal);
    }

    @Scheduled(
            cron = "${app.goal.weekly-summary-cron:0 0 8 ? * MON}",
            zone = "${app.goal.weekly-summary-zone:Asia/Kolkata}"
    )
    public void sendScheduledWeeklySummaries() {
        YearMonth currentMonth = YearMonth.now();
        String weekKey = getWeekKey(LocalDate.now());

        List<User> users = userRepository.findAllNormalUsers();
        for (User user : users) {
            try {
                UserMonthlyGoal goal = getOrCreateGoal(user, currentMonth);
                if (!goal.isWeeklySummaryEnabled()) {
                    continue;
                }
                if (weekKey.equals(goal.getLastSummaryWeekKey())) {
                    continue;
                }

                GoalProgressResponse progress = buildProgress(user, goal, currentMonth);
                sendWeeklySummaryEmailInternal(user, progress, weekKey);
                goal.setLastSummaryWeekKey(weekKey);
                userMonthlyGoalRepository.save(goal);
            } catch (Exception exception) {
                logger.warn(
                        "Weekly goal summary failed for user {} ({}): {}",
                        user.getId(),
                        user.getEmail(),
                        exception.getMessage()
                );
            }
        }
    }

    private GoalProgressResponse buildProgress(User user, UserMonthlyGoal goal, YearMonth month) {
        YearMonth previousMonth = month.minusMonths(1);
        double currentEmission = round(safeValue(carbonEntryRepository.getMonthlyEmission(
                user.getId(),
                month.getMonthValue(),
                month.getYear()
        )));
        double previousEmission = round(safeValue(carbonEntryRepository.getMonthlyEmission(
                user.getId(),
                previousMonth.getMonthValue(),
                previousMonth.getYear()
        )));

        double baselineEmission = previousEmission > 0
                ? previousEmission
                : Math.max(currentEmission, BASELINE_FALLBACK_KG);
        double targetReductionPct = goal.getTargetReductionPct() > 0
                ? goal.getTargetReductionPct()
                : DEFAULT_TARGET_REDUCTION_PCT;
        double targetReductionKg = round((baselineEmission * targetReductionPct) / 100.0);
        double targetEmissionKg = round(Math.max(0, baselineEmission - targetReductionKg));
        double actualReductionKg = round(Math.max(0, baselineEmission - currentEmission));
        double progressPct = targetReductionKg > 0
                ? round(Math.min(100, (actualReductionKg / targetReductionKg) * 100))
                : 100;
        WeeklyWindow weeklyWindow = getWeeklyWindow(user.getId());
        List<GoalMilestoneResponse> milestones = buildMilestones(
                actualReductionKg,
                targetReductionKg,
                weeklyWindow.emissionKg(),
                weeklyWindow.loggedDays()
        );
        List<String> unlockedBadges = milestones.stream()
                .filter(GoalMilestoneResponse::isUnlocked)
                .map(GoalMilestoneResponse::getTitle)
                .toList();
        int level = Math.max(1, (int) Math.ceil(progressPct / 20.0));
        int xp = (int) Math.round(progressPct * 10);
        String statusMessage = buildStatusMessage(progressPct, targetEmissionKg, currentEmission);

        return new GoalProgressResponse(
                month.getMonthValue(),
                month.getYear(),
                round(targetReductionPct),
                round(baselineEmission),
                currentEmission,
                targetReductionKg,
                targetEmissionKg,
                actualReductionKg,
                progressPct,
                goal.isWeeklySummaryEnabled(),
                Math.min(level, 5),
                xp,
                statusMessage,
                unlockedBadges,
                milestones
        );
    }

    private List<GoalMilestoneResponse> buildMilestones(
            double actualReductionKg,
            double targetReductionKg,
            double weeklyEmission,
            int weeklyLoggedDays
    ) {
        List<GoalMilestoneResponse> milestones = new ArrayList<>();

        boolean first100Unlocked = actualReductionKg >= 100;
        milestones.add(new GoalMilestoneResponse(
                "FIRST_100_KG_REDUCED",
                "First 100kg Reduced",
                "Cut a total of 100kg from your baseline month.",
                100,
                round(actualReductionKg),
                round(Math.min(100, (actualReductionKg / 100.0) * 100)),
                first100Unlocked
        ));

        double halfwayTarget = targetReductionKg > 0 ? targetReductionKg * 0.5 : 0;
        boolean halfwayUnlocked = halfwayTarget > 0 && actualReductionKg >= halfwayTarget;
        milestones.add(new GoalMilestoneResponse(
                "HALFWAY_HERO",
                "Halfway Hero",
                "Reach 50% of your monthly reduction target.",
                round(halfwayTarget),
                round(actualReductionKg),
                halfwayTarget > 0 ? round(Math.min(100, (actualReductionKg / halfwayTarget) * 100)) : 0,
                halfwayUnlocked
        ));

        boolean neutralWeekUnlocked = weeklyLoggedDays >= 5 && weeklyEmission <= CARBON_NEUTRAL_WEEK_CAP_KG;
        milestones.add(new GoalMilestoneResponse(
                "CARBON_NEUTRAL_WEEK",
                "Carbon Neutral Week",
                "Keep your last 7-day footprint at or under 7kg with activity logged on at least 5 days.",
                CARBON_NEUTRAL_WEEK_CAP_KG,
                round(weeklyEmission),
                weeklyLoggedDays == 0
                        ? 0
                        : round(Math.min(100, (CARBON_NEUTRAL_WEEK_CAP_KG / Math.max(weeklyEmission, CARBON_NEUTRAL_WEEK_CAP_KG)) * 100)),
                neutralWeekUnlocked
        ));

        return milestones;
    }

    private String buildStatusMessage(double progressPct, double targetEmissionKg, double currentEmissionKg) {
        if (progressPct >= 100) {
            return "Goal complete this month. Keep the momentum and push for bonus badges.";
        }
        if (progressPct >= 70) {
            return "You are close to your monthly target. Stay consistent this week.";
        }
        if (currentEmissionKg > targetEmissionKg) {
            return "You are above the target line right now, but a focused week can still recover this month.";
        }
        return "Good start. Keep trimming repeat high-emission habits to accelerate progress.";
    }

    private WeeklyWindow getWeeklyWindow(Long userId) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(6);
        List<Object[]> dailyTotals = carbonEntryRepository.getDailyTotalsByUserAndDateRange(userId, start, end);
        double weeklyEmission = dailyTotals
                .stream()
                .mapToDouble(row -> safeValue((Double) row[1]))
                .sum();

        return new WeeklyWindow(round(weeklyEmission), dailyTotals.size());
    }

    private UserMonthlyGoal getOrCreateGoal(User user, YearMonth month) {
        return userMonthlyGoalRepository
                .findByUserIdAndGoalMonthAndGoalYear(user.getId(), month.getMonthValue(), month.getYear())
                .orElseGet(() -> {
                    UserMonthlyGoal goal = new UserMonthlyGoal();
                    goal.setUser(user);
                    goal.setGoalMonth(month.getMonthValue());
                    goal.setGoalYear(month.getYear());
                    goal.setTargetReductionPct(DEFAULT_TARGET_REDUCTION_PCT);
                    goal.setWeeklySummaryEnabled(true);
                    return userMonthlyGoalRepository.save(goal);
                });
    }

    private void sendWeeklySummaryEmailInternal(User user, GoalProgressResponse progress, String weekKey) {
        String subject = "Your weekly carbon goal summary - " + weekKey;
        String badges = progress.getUnlockedBadges().isEmpty()
                ? "No badge unlocked yet this week. Keep going."
                : String.join(", ", progress.getUnlockedBadges());

        String body = "Hi " + user.getName() + ",\n\n"
                + "Here is your weekly goal update:\n"
                + "- Monthly target: reduce " + progress.getTargetReductionPct() + "%\n"
                + "- Baseline: " + progress.getBaselineEmissionKg() + " kg\n"
                + "- Current month total: " + progress.getCurrentEmissionKg() + " kg\n"
                + "- Target month-end total: " + progress.getTargetEmissionKg() + " kg\n"
                + "- Reduction achieved: " + progress.getActualReductionKg() + " kg\n"
                + "- Progress: " + progress.getProgressPct() + "%\n"
                + "- Level: " + progress.getGamificationLevel() + " (" + progress.getGamificationXp() + " XP)\n"
                + "- Badges: " + badges + "\n\n"
                + progress.getStatusMessage() + "\n\n"
                + "Regards,\nCarbonTrack";

        emailService.sendGoalSummaryEmail(user.getEmail(), subject, body);
    }

    private String getWeekKey(LocalDate date) {
        WeekFields weekFields = WeekFields.of(Locale.getDefault());
        int weekBasedYear = date.get(weekFields.weekBasedYear());
        int week = date.get(weekFields.weekOfWeekBasedYear());
        return weekBasedYear + "-W" + String.format("%02d", week);
    }

    private double safeValue(Double value) {
        return value != null ? value : 0;
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private record WeeklyWindow(double emissionKg, int loggedDays) { }
}
