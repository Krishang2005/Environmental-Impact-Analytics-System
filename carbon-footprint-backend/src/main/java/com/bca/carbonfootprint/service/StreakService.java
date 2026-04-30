package com.bca.carbonfootprint.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bca.carbonfootprint.dto.ActionRecommendationResponse;
import com.bca.carbonfootprint.dto.AdminUserStreakResponse;
import com.bca.carbonfootprint.dto.AdminUserStreakUpdateRequest;
import com.bca.carbonfootprint.dto.CarbonBreakdownResponse;
import com.bca.carbonfootprint.dto.StreakCalendarDayResponse;
import com.bca.carbonfootprint.dto.StreakOverviewResponse;
import com.bca.carbonfootprint.dto.ZoneCompetitionEntryResponse;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.model.UserDailyCheckIn;
import com.bca.carbonfootprint.model.UserStreak;
import com.bca.carbonfootprint.repository.CarbonEntryRepository;
import com.bca.carbonfootprint.repository.UserDailyCheckInRepository;
import com.bca.carbonfootprint.repository.UserRepository;
import com.bca.carbonfootprint.repository.UserStreakRepository;

@Service
public class StreakService {

    private static final int MONTHLY_FREEZE_CREDITS = 2;
    private static final int[] MILESTONES = {3, 7, 14, 30};

    private final UserStreakRepository userStreakRepository;
    private final UserDailyCheckInRepository userDailyCheckInRepository;
    private final UserRepository userRepository;
    private final CarbonEntryRepository carbonEntryRepository;
    private final CarbonEntryService carbonEntryService;
    private final RewardService rewardService;

    public StreakService(
            UserStreakRepository userStreakRepository,
            UserDailyCheckInRepository userDailyCheckInRepository,
            UserRepository userRepository,
            CarbonEntryRepository carbonEntryRepository,
            CarbonEntryService carbonEntryService,
            RewardService rewardService
    ) {
        this.userStreakRepository = userStreakRepository;
        this.userDailyCheckInRepository = userDailyCheckInRepository;
        this.userRepository = userRepository;
        this.carbonEntryRepository = carbonEntryRepository;
        this.carbonEntryService = carbonEntryService;
        this.rewardService = rewardService;
    }

    @Transactional
    public StreakOverviewResponse getOverview(User user) {
        UserStreak streak = getOrCreateStreak(user);
        refreshMonthlyFreezeCredits(streak, LocalDate.now());
        return buildOverview(user, streak, null, false, 0);
    }

    @Transactional
    public StreakOverviewResponse checkIn(User user) {
        LocalDate today = LocalDate.now();
        UserStreak streak = getOrCreateStreak(user);
        refreshMonthlyFreezeCredits(streak, today);

        if (userDailyCheckInRepository.existsByUser_IdAndCheckInDate(user.getId(), today)) {
            return buildOverview(user, streak, "You already checked in today. Your streak is safe.", false, 0);
        }

        boolean freezeUsedToday = false;
        String actionMessage;
        LocalDate lastCheckInDate = streak.getLastCheckInDate();

        if (lastCheckInDate == null) {
            streak.setCurrentStreak(1);
            streak.setWeeklyBoxesClaimedInCycle(0);
            actionMessage = "Your streak has started. Come back tomorrow to grow it.";
        } else {
            long gapDays = ChronoUnit.DAYS.between(lastCheckInDate, today);
            if (gapDays <= 1) {
                streak.setCurrentStreak(streak.getCurrentStreak() + 1);
                actionMessage = "Daily streak maintained. Nice work showing up again.";
            } else if (gapDays == 2 && streak.getFreezeCredits() > 0) {
                streak.setCurrentStreak(streak.getCurrentStreak() + 1);
                streak.setFreezeCredits(streak.getFreezeCredits() - 1);
                freezeUsedToday = true;
                actionMessage = "Freeze shield activated. Your streak survived yesterday's miss.";
            } else {
                streak.setCurrentStreak(1);
                streak.setWeeklyBoxesClaimedInCycle(0);
                actionMessage = "New streak started today. Build it back stronger this week.";
            }
        }

        streak.setLastCheckInDate(today);
        streak.setLongestStreak(Math.max(streak.getLongestStreak(), streak.getCurrentStreak()));
        streak.setTotalCheckIns(streak.getTotalCheckIns() + 1);

        boolean perfectGreenDay = isPerfectGreenDay(user, today);
        if (perfectGreenDay) {
            streak.setPerfectGreenDays(streak.getPerfectGreenDays() + 1);
        }

        String dailyTip = buildDailyTip(user, streak.getCurrentStreak(), perfectGreenDay);
        streak.setLastTipUnlockedDate(today);
        streak.setLastUnlockedTip(dailyTip);

        UserDailyCheckIn checkIn = new UserDailyCheckIn();
        checkIn.setUser(user);
        checkIn.setCheckInDate(today);
        checkIn.setPerfectGreenDay(perfectGreenDay);
        checkIn.setUnlockedTip(dailyTip);
        checkIn.setCreatedAt(LocalDateTime.now());
        userDailyCheckInRepository.save(checkIn);

        int pointsEarned = awardCheckInRewards(user, streak, today, perfectGreenDay);
        userStreakRepository.save(streak);

        String enrichedMessage = actionMessage + (perfectGreenDay
                ? " You also earned a perfect green day."
                : " Keep your emissions light to unlock a green day badge next time.");

        return buildOverview(user, streak, enrichedMessage, freezeUsedToday, pointsEarned);
    }

    @Transactional
    public StreakOverviewResponse claimWeeklyReward(User user) {
        LocalDate today = LocalDate.now();
        UserStreak streak = getOrCreateStreak(user);
        refreshMonthlyFreezeCredits(streak, today);

        int availableBoxes = Math.max(0, (streak.getCurrentStreak() / 7) - streak.getWeeklyBoxesClaimedInCycle());
        if (availableBoxes <= 0) {
            return buildOverview(user, streak, "No weekly reward box is ready yet. Reach the next 7-day mark.", false, 0);
        }

        streak.setWeeklyBoxesClaimedInCycle(streak.getWeeklyBoxesClaimedInCycle() + 1);
        int bonusPoints = rewardService.awardPoints(
                user,
                "STREAK_WEEKLY_BOX",
                "week-box-" + today + "-streak-" + streak.getCurrentStreak(),
                25,
                "Opened a weekly streak reward box"
        );

        if (streak.getFreezeCredits() < MONTHLY_FREEZE_CREDITS + 1) {
            streak.setFreezeCredits(streak.getFreezeCredits() + 1);
        }

        userStreakRepository.save(streak);
        return buildOverview(user, streak, "Weekly reward box opened. Bonus points and one extra freeze added.", false, bonusPoints);
    }

    @Transactional
    public AdminUserStreakResponse getAdminStreakProfile(User user) {
        UserStreak streak = getOrCreateStreak(user);
        refreshMonthlyFreezeCredits(streak, LocalDate.now());
        return buildAdminResponse(user, streak);
    }

    @Transactional
    public AdminUserStreakResponse updateAdminStreakProfile(User user, AdminUserStreakUpdateRequest request) {
        UserStreak streak = getOrCreateStreak(user);
        refreshMonthlyFreezeCredits(streak, LocalDate.now());

        if (request.getCurrentStreak() != null) {
            streak.setCurrentStreak(Math.max(0, request.getCurrentStreak()));
        }
        if (request.getLongestStreak() != null) {
            streak.setLongestStreak(Math.max(streak.getCurrentStreak(), request.getLongestStreak()));
        } else {
            streak.setLongestStreak(Math.max(streak.getLongestStreak(), streak.getCurrentStreak()));
        }
        if (request.getTotalCheckIns() != null) {
            streak.setTotalCheckIns(Math.max(0, request.getTotalCheckIns()));
        }
        if (request.getFreezeCredits() != null) {
            streak.setFreezeCredits(Math.max(0, request.getFreezeCredits()));
        }
        if (request.getPerfectGreenDays() != null) {
            streak.setPerfectGreenDays(Math.max(0, request.getPerfectGreenDays()));
        }
        if (request.getCustomMilestoneTargetDays() != null) {
            streak.setCustomMilestoneTargetDays(
                    request.getCustomMilestoneTargetDays() > 0
                            ? request.getCustomMilestoneTargetDays()
                            : null
            );
        }
        if (request.getWeeklyBoxesAvailable() != null) {
            int eligibleBoxes = Math.max(0, streak.getCurrentStreak() / 7);
            int desiredAvailable = Math.max(0, Math.min(eligibleBoxes, request.getWeeklyBoxesAvailable()));
            streak.setWeeklyBoxesClaimedInCycle(Math.max(0, eligibleBoxes - desiredAvailable));
        }

        if (request.getBonusRewardPoints() != null && request.getBonusRewardPoints() > 0) {
            rewardService.awardPoints(
                    user,
                    "ADMIN_STREAK_BONUS",
                    "admin-bonus-" + LocalDateTime.now(),
                    request.getBonusRewardPoints(),
                    request.getBonusRewardDescription() != null && !request.getBonusRewardDescription().isBlank()
                            ? request.getBonusRewardDescription()
                            : "Admin granted bonus reward points"
            );
        }

        userStreakRepository.save(streak);
        return buildAdminResponse(user, streak);
    }

    private StreakOverviewResponse buildOverview(
            User user,
            UserStreak streak,
            String actionMessage,
            boolean freezeUsedToday,
            int pointsEarnedToday
    ) {
        LocalDate today = LocalDate.now();
        boolean checkedInToday = userDailyCheckInRepository.existsByUser_IdAndCheckInDate(user.getId(), today);
        boolean todayPerfectGreenDay = false;
        if (checkedInToday) {
            List<Object[]> todayWindow = userDailyCheckInRepository.getCheckInWindow(user.getId(), today, today);
            if (!todayWindow.isEmpty()) {
                todayPerfectGreenDay = Boolean.TRUE.equals(todayWindow.get(0)[1]);
            }
        }

        int nextMilestone = resolveNextMilestone(streak);
        int daysToNextMilestone = nextMilestone > 0 ? Math.max(0, nextMilestone - streak.getCurrentStreak()) : 0;
        int weeklyBoxesAvailable = Math.max(0, (streak.getCurrentStreak() / 7) - streak.getWeeklyBoxesClaimedInCycle());
        String zoneName = user.getZone() != null ? user.getZone().getName() : "Unassigned";
        long zoneActiveUsersToday = user.getZone() != null
                ? userDailyCheckInRepository.countByUser_Zone_IdAndCheckInDate(user.getZone().getId(), today)
                : 0;
        long zoneTotalUsers = user.getZone() != null
                ? userRepository.countByZone_Id(user.getZone().getId())
                : 0;

        return new StreakOverviewResponse(
                streak.getCurrentStreak(),
                streak.getLongestStreak(),
                streak.getTotalCheckIns(),
                streak.getFreezeCredits(),
                streak.getPerfectGreenDays(),
                rewardService.getTotalPoints(user.getId()),
                checkedInToday,
                todayPerfectGreenDay,
                weeklyBoxesAvailable > 0,
                weeklyBoxesAvailable,
                checkedInToday ? streak.getLastUnlockedTip() : null,
                buildReminderMessage(streak, checkedInToday),
                actionMessage,
                freezeUsedToday,
                pointsEarnedToday,
                nextMilestone,
                daysToNextMilestone,
                resolveGrowthStage(streak.getCurrentStreak()),
                resolveGrowthProgress(streak),
                zoneName,
                zoneActiveUsersToday,
                zoneTotalUsers,
                getZoneActiveDayStreak(user),
                buildRecentCalendar(user),
                buildZoneCompetition(user)
        );
    }

    private UserStreak getOrCreateStreak(User user) {
        return userStreakRepository.findByUser_Id(user.getId())
                .orElseGet(() -> {
                    UserStreak streak = new UserStreak();
                    streak.setUser(user);
                    streak.setFreezeCredits(MONTHLY_FREEZE_CREDITS);
                    streak.setFreezeCreditsResetDate(LocalDate.now());
                    return userStreakRepository.save(streak);
                });
    }

    private void refreshMonthlyFreezeCredits(UserStreak streak, LocalDate today) {
        LocalDate resetDate = streak.getFreezeCreditsResetDate();
        if (resetDate == null
                || resetDate.getMonthValue() != today.getMonthValue()
                || resetDate.getYear() != today.getYear()) {
            streak.setFreezeCredits(MONTHLY_FREEZE_CREDITS);
            streak.setFreezeCreditsResetDate(today);
        }
    }

    private boolean isPerfectGreenDay(User user, LocalDate today) {
        YearMonth currentMonth = YearMonth.from(today);
        double zoneMax = user.getZone() != null && user.getZone().getEmissionLimitMaxKg() != null
                ? user.getZone().getEmissionLimitMaxKg()
                : 400.0;
        double dailyBudget = zoneMax / currentMonth.lengthOfMonth();
        double todayEmission = safeValue(carbonEntryRepository.getTodayEmissionByUser(user.getId()));
        return todayEmission <= round(dailyBudget);
    }

    private int awardCheckInRewards(User user, UserStreak streak, LocalDate today, boolean perfectGreenDay) {
        int points = 0;

        points += rewardService.awardPoints(
                user,
                "STREAK_CHECKIN",
                "daily-checkin-" + today,
                5,
                "Completed daily streak check-in"
        );

        if (perfectGreenDay) {
            points += rewardService.awardPoints(
                    user,
                    "STREAK_GREEN_DAY",
                    "green-day-" + today,
                    10,
                    "Maintained a low-emission green day"
            );
        }

        for (int milestone : MILESTONES) {
            if (streak.getCurrentStreak() == milestone) {
                points += rewardService.awardPoints(
                        user,
                        "STREAK_MILESTONE",
                        "milestone-" + milestone + "-" + today,
                        milestoneRewardPoints(milestone),
                        "Reached a " + milestone + "-day streak milestone"
                );
            }
        }

        return points;
    }

    private int milestoneRewardPoints(int milestone) {
        return switch (milestone) {
            case 3 -> 15;
            case 7 -> 35;
            case 14 -> 80;
            case 30 -> 180;
            default -> 10;
        };
    }

    private String buildDailyTip(User user, int streakDays, boolean perfectGreenDay) {
        List<CarbonBreakdownResponse> breakdown = carbonEntryService.getCategoryBreakdown(user)
                .stream()
                .sorted(Comparator.comparingDouble(CarbonBreakdownResponse::getCarbonAmount).reversed())
                .toList();

        if (perfectGreenDay) {
            return "Perfect green day unlocked. Repeat today's lighter habits tomorrow to keep your streak strong.";
        }

        if (breakdown.isEmpty()) {
            return "Log one meaningful activity tomorrow so your AI coach can unlock sharper reduction tips.";
        }

        CarbonBreakdownResponse top = breakdown.get(0);
        String activity = top.getActivityType().toLowerCase().replace('_', ' ');

        if (streakDays >= 14) {
            return "Your streak is strong. Focus on reducing " + activity + " this week for a visible monthly drop.";
        }
        if (streakDays >= 7) {
            return "Weekly tip unlocked: trim your highest source, " + activity + ", by one small action tomorrow.";
        }
        return "Daily AI tip: your biggest source is " + activity + ". Start there for the fastest improvement.";
    }

    private String buildReminderMessage(UserStreak streak, boolean checkedInToday) {
        if (checkedInToday) {
            return "You already protected today's streak. Come back tomorrow for the next reward.";
        }

        LocalDate today = LocalDate.now();
        if (streak.getLastCheckInDate() != null && streak.getLastCheckInDate().equals(today.minusDays(2)) && streak.getFreezeCredits() > 0) {
            return "You missed yesterday, but a freeze shield can still protect your streak if you check in today.";
        }

        if (streak.getCurrentStreak() >= 6) {
            return "Check in before midnight to keep your " + streak.getCurrentStreak() + "-day streak alive and move toward the weekly reward box.";
        }

        return "One check-in today keeps your streak moving and unlocks a fresh AI tip.";
    }

    private int resolveNextMilestone(UserStreak streak) {
        int currentStreak = streak.getCurrentStreak();
        Integer customTarget = streak.getCustomMilestoneTargetDays();
        if (customTarget != null && customTarget > currentStreak) {
            return customTarget;
        }
        for (int milestone : MILESTONES) {
            if (currentStreak < milestone) {
                return milestone;
            }
        }
        return ((currentStreak / 7) + 1) * 7;
    }

    private String resolveGrowthStage(int currentStreak) {
        if (currentStreak >= 30) return "Forest Guardian";
        if (currentStreak >= 14) return "Eco Tree";
        if (currentStreak >= 7) return "Strong Sapling";
        if (currentStreak >= 3) return "Growing Sprout";
        return "New Seed";
    }

    private int resolveGrowthProgress(UserStreak streak) {
        int currentStreak = streak.getCurrentStreak();
        int cycleTarget = resolveNextMilestone(streak);
        if (cycleTarget <= 0) {
            return 100;
        }
        int baseline = cycleTarget == 3 ? 0 : cycleTarget - 7;
        int window = cycleTarget - baseline;
        return Math.min(100, Math.max(0, (int) (((double) (currentStreak - baseline) / Math.max(1, window)) * 100)));
    }

    private List<StreakCalendarDayResponse> buildRecentCalendar(User user) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(6);
        Map<LocalDate, Boolean> perfectMap = new HashMap<>();

        userDailyCheckInRepository.getCheckInWindow(user.getId(), start, end)
                .forEach(row -> perfectMap.put((LocalDate) row[0], Boolean.TRUE.equals(row[1])));

        List<StreakCalendarDayResponse> response = new ArrayList<>();
        LocalDate cursor = start;
        while (!cursor.isAfter(end)) {
            boolean checkedIn = perfectMap.containsKey(cursor);
            response.add(new StreakCalendarDayResponse(
                    cursor.toString(),
                    checkedIn,
                    checkedIn && perfectMap.get(cursor)
            ));
            cursor = cursor.plusDays(1);
        }
        return response;
    }

    private List<ZoneCompetitionEntryResponse> buildZoneCompetition(User user) {
        List<Object[]> rows = userDailyCheckInRepository.getZoneCompetitionByDate(LocalDate.now());
        List<ZoneCompetitionEntryResponse> competition = new ArrayList<>();

        for (int i = 0; i < Math.min(5, rows.size()); i++) {
            Object[] row = rows.get(i);
            Long zoneId = (Long) row[0];
            String zoneName = (String) row[1];
            Long activeUsers = (Long) row[2];
            boolean currentZone = user.getZone() != null && user.getZone().getId().equals(zoneId);
            competition.add(new ZoneCompetitionEntryResponse(i + 1, zoneId, zoneName, activeUsers, currentZone));
        }

        return competition;
    }

    private int getZoneActiveDayStreak(User user) {
        if (user.getZone() == null) {
            return 0;
        }

        int streak = 0;
        LocalDate cursor = LocalDate.now();
        while (streak < 30) {
            long activeCount = userDailyCheckInRepository.countByUser_Zone_IdAndCheckInDate(user.getZone().getId(), cursor);
            if (activeCount <= 0) {
                break;
            }
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private double safeValue(Double value) {
        return value != null ? value : 0;
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private AdminUserStreakResponse buildAdminResponse(User user, UserStreak streak) {
        int nextMilestone = resolveNextMilestone(streak);
        int daysToNextMilestone = Math.max(0, nextMilestone - streak.getCurrentStreak());
        int weeklyBoxesAvailable = Math.max(0, (streak.getCurrentStreak() / 7) - streak.getWeeklyBoxesClaimedInCycle());

        return new AdminUserStreakResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getZone() != null ? user.getZone().getName() : "Unassigned",
                streak.getCurrentStreak(),
                streak.getLongestStreak(),
                streak.getTotalCheckIns(),
                streak.getFreezeCredits(),
                streak.getPerfectGreenDays(),
                rewardService.getTotalPoints(user.getId()),
                weeklyBoxesAvailable,
                nextMilestone,
                daysToNextMilestone,
                streak.getCustomMilestoneTargetDays()
        );
    }
}
