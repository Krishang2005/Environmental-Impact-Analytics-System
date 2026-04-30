package com.bca.carbonfootprint.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

import org.springframework.stereotype.Service;

import com.bca.carbonfootprint.dto.MissionResponse;
import com.bca.carbonfootprint.model.ActivityType;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.model.UserMission;
import com.bca.carbonfootprint.repository.CarbonEntryRepository;
import com.bca.carbonfootprint.repository.UserMissionRepository;

@Service
public class MissionService {

    private final UserMissionRepository userMissionRepository;
    private final CarbonEntryRepository carbonEntryRepository;
    private final RewardService rewardService;

    public MissionService(
            UserMissionRepository userMissionRepository,
            CarbonEntryRepository carbonEntryRepository,
            RewardService rewardService
    ) {
        this.userMissionRepository = userMissionRepository;
        this.carbonEntryRepository = carbonEntryRepository;
        this.rewardService = rewardService;
    }

    public MissionResponse getCurrentMission(User user) {
        UserMission mission = ensureCurrentMission(user);
        updateCurrentMissionProgress(user);
        UserMission refreshed = userMissionRepository.findById(mission.getId()).orElse(mission);
        return toResponse(refreshed);
    }

    public void updateCurrentMissionProgress(User user) {
        UserMission mission = ensureCurrentMission(user);

        LocalDate weekStart = mission.getWeekStartDate();
        LocalDate weekEnd = weekStart.plusDays(6);

        double currentQty = safeValue(carbonEntryRepository.getActivityQuantityByUserAndDateRange(
                user.getId(),
                mission.getActivityType(),
                weekStart,
                weekEnd
        ));
        double currentEmission = safeValue(carbonEntryRepository.getActivityEmissionByUserAndDateRange(
                user.getId(),
                mission.getActivityType(),
                weekStart,
                weekEnd
        ));

        mission.setCurrentQuantity(round(currentQty));
        mission.setCurrentEmission(round(currentEmission));

        boolean completed = currentEmission <= mission.getTargetEmission();

        if (completed && mission.getCompletedAt() == null) {
            mission.setCompletedAt(LocalDateTime.now());
        }

        if (completed && !mission.isRewardGranted()) {
            rewardService.awardPoints(
                    user,
                    "WEEKLY_MISSION",
                    mission.getWeekStartDate().toString(),
                    mission.getRewardPoints(),
                    "Completed weekly reduction mission"
            );
            mission.setRewardGranted(true);
        }

        userMissionRepository.save(mission);
    }

    private UserMission ensureCurrentMission(User user) {
        LocalDate weekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return userMissionRepository.findByUser_IdAndWeekStartDate(user.getId(), weekStart)
                .orElseGet(() -> userMissionRepository.save(buildMission(user, weekStart)));
    }

    private UserMission buildMission(User user, LocalDate weekStart) {
        LocalDate previousWeekStart = weekStart.minusWeeks(1);
        LocalDate previousWeekEnd = previousWeekStart.plusDays(6);

        List<Object[]> activityRows = carbonEntryRepository.getActivityTotalsByUserAndDateRange(
                user.getId(),
                previousWeekStart,
                previousWeekEnd
        );

        ActivityType focusActivity = ActivityType.CAR;
        double baselineQty;
        double baselineEmission;

        if (activityRows.isEmpty()) {
            baselineQty = 40;
            baselineEmission = 40 * 0.21;
        } else {
            // ✅ FIX: replaced activityRows.getFirst() with activityRows.get(0)
            Object[] top = activityRows.get(0);
            focusActivity = (ActivityType) top[0];
            baselineQty = safeValue((Double) top[1]);
            baselineEmission = safeValue((Double) top[2]);
        }

        double targetQty = Math.max(0, baselineQty * 0.85);
        double targetEmission = Math.max(0, baselineEmission * 0.85);

        UserMission mission = new UserMission();
        mission.setUser(user);
        mission.setWeekStartDate(weekStart);
        mission.setActivityType(focusActivity);
        mission.setTitle("Reduce " + formatActivity(focusActivity) + " footprint this week");
        mission.setDescription("Keep your weekly " + formatActivity(focusActivity)
                + " emissions below " + round(targetEmission)
                + " kg CO2 and unlock rewards.");
        mission.setBaselineQuantity(round(baselineQty));
        mission.setBaselineEmission(round(baselineEmission));
        mission.setTargetQuantity(round(targetQty));
        mission.setTargetEmission(round(targetEmission));
        mission.setCurrentQuantity(0);
        mission.setCurrentEmission(0);
        mission.setRewardPoints(30);
        mission.setRewardGranted(false);
        return mission;
    }

    private MissionResponse toResponse(UserMission mission) {
        double progress;
        if (mission.getBaselineEmission() <= mission.getTargetEmission()) {
            progress = mission.getCurrentEmission() <= mission.getTargetEmission() ? 100 : 0;
        } else {
            double reduced = Math.max(0, mission.getBaselineEmission() - mission.getCurrentEmission());
            double required = mission.getBaselineEmission() - mission.getTargetEmission();
            progress = Math.min(100, round((reduced / required) * 100));
        }

        boolean completed = mission.getCurrentEmission() <= mission.getTargetEmission();

        return new MissionResponse(
                mission.getWeekStartDate(),
                mission.getTitle(),
                mission.getDescription(),
                mission.getActivityType().name(),
                mission.getBaselineQuantity(),
                mission.getBaselineEmission(),
                mission.getTargetQuantity(),
                mission.getTargetEmission(),
                mission.getCurrentQuantity(),
                mission.getCurrentEmission(),
                progress,
                completed,
                mission.getRewardPoints(),
                mission.isRewardGranted(),
                mission.getCompletedAt()
        );
    }

    private String formatActivity(ActivityType activityType) {
        return activityType.name().toLowerCase().replace('_', ' ');
    }

    private double safeValue(Double value) {
        return value != null ? value : 0;
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}