package com.bca.carbonfootprint.service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bca.carbonfootprint.dto.AdminNotificationDispatchResponse;
import com.bca.carbonfootprint.dto.AdminNotificationHistoryResponse;
import com.bca.carbonfootprint.dto.UserNotificationResponse;
import com.bca.carbonfootprint.dto.UserNotificationSummaryResponse;
import com.bca.carbonfootprint.model.ActivityType;
import com.bca.carbonfootprint.model.AlertStatus;
import com.bca.carbonfootprint.model.EnvironmentalIssue;
import com.bca.carbonfootprint.model.HighEmitterAlert;
import com.bca.carbonfootprint.model.IssueStatus;
import com.bca.carbonfootprint.model.Notification;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.repository.AdminActivityLogRepository;
import com.bca.carbonfootprint.repository.CarbonEntryRepository;
import com.bca.carbonfootprint.repository.HighEmitterAlertRepository;
import com.bca.carbonfootprint.repository.NotificationRepository;
import com.bca.carbonfootprint.repository.UserRepository;

@Service
public class NotificationService {

    private static final double DEFAULT_ZONE_LIMIT_MAX_KG = 400.0;
    private static final double NEAR_LIMIT_RATIO = 0.85;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CarbonEntryRepository carbonEntryRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HighEmitterAlertRepository highEmitterAlertRepository;

    @Autowired
    private AdminActivityLogService adminActivityLogService;

    @Autowired
    private AdminActivityLogRepository adminActivityLogRepository;

    public void evaluateEmissionStatus(User user, double monthlyEmission) {
        double zoneCap = resolveZoneCap(user);
        if (zoneCap <= 0) {
            return;
        }

        double usageRatio = monthlyEmission / zoneCap;
        String referencePeriod = YearMonth.now().toString();

        if (usageRatio >= 1.0) {
            createEmissionNotification(user, monthlyEmission, zoneCap, referencePeriod, true);
            return;
        }

        if (usageRatio >= NEAR_LIMIT_RATIO) {
            createEmissionNotification(user, monthlyEmission, zoneCap, referencePeriod, false);
        }
    }

    public UserNotificationSummaryResponse getUserNotifications(User user) {
        List<UserNotificationResponse> notifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .limit(10)
                .map(notification -> new UserNotificationResponse(
                        notification.getId(),
                        notification.getTitle(),
                        notification.getMessage(),
                        notification.getType(),
                        notification.getSeverity(),
                        notification.isReadStatus(),
                        notification.getCreatedAt()
                ))
                .toList();

        long unreadCount = notificationRepository.countByUserIdAndReadStatusFalse(user.getId());
        return new UserNotificationSummaryResponse(unreadCount, notifications);
    }

    public int markAllAsRead(User user) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndReadStatusFalse(user.getId());
        unreadNotifications.forEach(notification -> notification.setReadStatus(true));
        notificationRepository.saveAll(unreadNotifications);
        return unreadNotifications.size();
    }

    public void notifyComplaintStatusChange(
            User user,
            EnvironmentalIssue issue,
            IssueStatus previousStatus,
            IssueStatus newStatus
    ) {
        String title = "Complaint status updated";
        String message = "Your complaint #" + issue.getId()
                + " changed from " + formatStatus(previousStatus)
                + " to " + formatStatus(newStatus) + ".";

        createAdminNotification(user, title, message, "COMPLAINT_STATUS_UPDATE", resolveComplaintSeverity(newStatus));
        try {
            emailService.sendEmissionAlertEmail(
                    user.getEmail(),
                    title + " - CarbonTrack",
                    "Dear " + user.getName() + ",\n\n"
                            + message + "\n\n"
                            + "Complaint: " + issue.getTitle() + "\n"
                            + "Zone: " + issue.getMappedZoneName() + "\n\n"
                            + "Regards,\nCarbonTrack Admin"
            );
        } catch (Exception ex) {
            System.err.println("Complaint status email failed for " + user.getEmail() + ": " + ex.getMessage());
        }
    }

    private String resolveComplaintSeverity(IssueStatus status) {
        return status == IssueStatus.REJECTED ? "MEDIUM" : "HIGH";
    }

    private String formatStatus(IssueStatus status) {
        if (status == null) {
            return "new";
        }
        return status.name().replace('_', ' ').toLowerCase();
    }

    public AdminNotificationDispatchResponse broadcastToAllUsers(
            String actorEmail,
            String title,
            String message,
            String severity
    ) {
        String safeSeverity = normalizeSeverity(severity);
        List<User> recipients = userRepository.findAllNormalUsers();
        for (User recipient : recipients) {
            createAdminNotification(recipient, title, message, "ADMIN_BROADCAST", safeSeverity);
        }

        int count = recipients.size();
        adminActivityLogService.log(
                actorEmail,
                "ADMIN_BROADCAST",
                "Admin broadcast sent to " + count + " users: " + trimTitle(title)
        );

        return new AdminNotificationDispatchResponse(
                "ok",
                "ALL_USERS",
                count,
                title,
                message,
                safeSeverity,
                LocalDateTime.now(),
                actorEmail
        );
    }

    public AdminNotificationDispatchResponse sendInbuiltHighEmitterMessage(String actorEmail) {
        List<HighEmitterAlert> pendingAlerts = highEmitterAlertRepository.findByStatus(AlertStatus.PENDING);
        Map<Long, HighEmitterAlert> latestByUserId = new LinkedHashMap<>();

        pendingAlerts.stream()
                .filter(alert -> alert.getUser() != null)
                .sorted((a, b) -> {
                    LocalDateTime aTime = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN;
                    LocalDateTime bTime = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN;
                    return bTime.compareTo(aTime);
                })
                .forEach(alert -> latestByUserId.putIfAbsent(alert.getUser().getId(), alert));

        String title = "Danger level warning: you are currently a high emitter";
        int count = 0;
        for (HighEmitterAlert alert : latestByUserId.values()) {
            User user = alert.getUser();
            if (user == null) {
                continue;
            }

            String zoneName = user.getZone() != null ? user.getZone().getName() : "your zone";
            double totalEmission = alert.getTotalEmission() != null ? alert.getTotalEmission() : 0.0;
            double threshold = alert.getThresholdValue() != null ? alert.getThresholdValue() : resolveZoneCap(user);
            String focusArea = getTopActivityLabel(user);
            String inAppMessage = buildInbuiltHighEmitterWarningMessage(
                    user,
                    zoneName,
                    totalEmission,
                    threshold,
                    focusArea
            );
            String emailBody = buildInbuiltHighEmitterWarningEmailBody(
                    user,
                    zoneName,
                    totalEmission,
                    threshold,
                    focusArea
            );

            createAdminNotification(user, title, inAppMessage, "ADMIN_HIGH_EMITTER_WARNING", "HIGH");
            try {
                emailService.sendEmissionAlertEmail(
                        user.getEmail(),
                        "Danger level warning - CarbonTrack",
                        emailBody
                );
            } catch (Exception ex) {
                System.err.println("High-emitter admin warning email failed for " + user.getEmail() + ": " + ex.getMessage());
            }
            count++;
        }

        String summaryMessage = "Inbuilt high-emitter warning sent to " + count + " users.";
        adminActivityLogService.log(actorEmail, "HIGH_EMITTER_INBUILT_MESSAGE", summaryMessage);

        return new AdminNotificationDispatchResponse(
                "ok",
                "HIGH_EMITTERS",
                count,
                title,
                summaryMessage,
                "HIGH",
                LocalDateTime.now(),
                actorEmail
        );
    }

    public AdminNotificationDispatchResponse sendInbuiltHighEmitterMessageToSelected(
            String actorEmail,
            List<Long> selectedUserIds
    ) {
        Set<Long> selectedSet = new HashSet<>();
        if (selectedUserIds != null) {
            selectedUserIds.stream()
                    .filter(Objects::nonNull)
                    .forEach(selectedSet::add);
        }

        if (selectedSet.isEmpty()) {
            adminActivityLogService.log(actorEmail, "HIGH_EMITTER_SELECTED_MESSAGE", "No selected users provided.");
            return new AdminNotificationDispatchResponse(
                    "ok",
                    "SELECTED_HIGH_EMITTERS",
                    0,
                    "Danger level warning: selected users",
                    "No selected users were provided.",
                    "HIGH",
                    LocalDateTime.now(),
                    actorEmail
            );
        }

        List<HighEmitterAlert> pendingAlerts = highEmitterAlertRepository.findByStatus(AlertStatus.PENDING);
        Map<Long, HighEmitterAlert> latestByUserId = new LinkedHashMap<>();

        pendingAlerts.stream()
                .filter(alert -> alert.getUser() != null)
                .sorted((a, b) -> {
                    LocalDateTime aTime = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN;
                    LocalDateTime bTime = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN;
                    return bTime.compareTo(aTime);
                })
                .forEach(alert -> latestByUserId.putIfAbsent(alert.getUser().getId(), alert));

        String title = "Danger level warning: you are currently a high emitter";
        int count = 0;
        for (Long userId : selectedSet) {
            HighEmitterAlert alert = latestByUserId.get(userId);
            if (alert == null || alert.getUser() == null) {
                continue;
            }

            User user = alert.getUser();
            String zoneName = user.getZone() != null ? user.getZone().getName() : "your zone";
            double totalEmission = alert.getTotalEmission() != null ? alert.getTotalEmission() : 0.0;
            double threshold = alert.getThresholdValue() != null ? alert.getThresholdValue() : resolveZoneCap(user);
            String focusArea = getTopActivityLabel(user);
            String inAppMessage = buildInbuiltHighEmitterWarningMessage(
                    user,
                    zoneName,
                    totalEmission,
                    threshold,
                    focusArea
            );
            String emailBody = buildInbuiltHighEmitterWarningEmailBody(
                    user,
                    zoneName,
                    totalEmission,
                    threshold,
                    focusArea
            );

            createAdminNotification(user, title, inAppMessage, "ADMIN_HIGH_EMITTER_WARNING_SELECTED", "HIGH");
            try {
                emailService.sendEmissionAlertEmail(
                        user.getEmail(),
                        "Danger level warning - CarbonTrack",
                        emailBody
                );
            } catch (Exception ex) {
                System.err.println("Selected high-emitter warning email failed for " + user.getEmail() + ": " + ex.getMessage());
            }
            count++;
        }

        String summaryMessage = "Inbuilt high-emitter warning sent to selected users: " + count + ".";
        adminActivityLogService.log(actorEmail, "HIGH_EMITTER_SELECTED_MESSAGE", summaryMessage);

        return new AdminNotificationDispatchResponse(
                "ok",
                "SELECTED_HIGH_EMITTERS",
                count,
                title,
                summaryMessage,
                "HIGH",
                LocalDateTime.now(),
                actorEmail
        );
    }

    private String buildInbuiltHighEmitterWarningMessage(
            User user,
            String zoneName,
            double totalEmission,
            double threshold,
            String focusArea
    ) {
        return "Danger level alert from CarbonTrack Admin.\n"
                + "Current monthly emission: " + round(totalEmission) + " kg.\n"
                + "Safe threshold for " + zoneName + ": " + round(threshold) + " kg.\n"
                + "Main pressure area: " + focusArea + ".\n"
                + "Reduce high-impact activity immediately over the next 7 days.\n"
                + "If this trend continues, stronger zone controls may apply.";
    }

    private String buildInbuiltHighEmitterWarningEmailBody(
            User user,
            String zoneName,
            double totalEmission,
            double threshold,
            String focusArea
    ) {
        return "Dear " + user.getName() + ",\n\n"
                + "You are currently in the danger-level emission range.\n"
                + "Current monthly emission: " + round(totalEmission) + " kg.\n"
                + "Safe threshold for " + zoneName + ": " + round(threshold) + " kg.\n"
                + "Main pressure area: " + focusArea + ".\n\n"
                + "Action required now:\n"
                + "1) Cut your highest-impact activities this week.\n"
                + "2) Avoid unnecessary fuel and electricity usage.\n"
                + "3) Stay below your zone-safe range in upcoming entries.\n\n"
                + "This is an official warning from the admin panel.\n"
                + "Regards,\nCarbonTrack Admin";
    }

    public List<AdminNotificationHistoryResponse> getRecentAdminDispatchHistory() {
        return adminActivityLogRepository.findTop20ByOrderByCreatedAtDesc().stream()
                .filter(entry -> isDispatchAction(entry.getActionType()))
                .map(entry -> new AdminNotificationHistoryResponse(
                        entry.getId(),
                        entry.getActionType(),
                        entry.getDescription(),
                        entry.getActorEmail(),
                        entry.getCreatedAt()
                ))
                .toList();
    }

    private void createEmissionNotification(
            User user,
            double monthlyEmission,
            double zoneCap,
            String referencePeriod,
            boolean exceeded
    ) {
        String type = exceeded ? "EMISSION_LIMIT_EXCEEDED" : "EMISSION_NEAR_LIMIT";
        if (notificationRepository.existsByUserIdAndTypeAndReferencePeriod(user.getId(), type, referencePeriod)) {
            return;
        }

        String zoneName = user.getZone() != null ? user.getZone().getName() : "your zone";
        String focusArea = getTopActivityLabel(user);
        String aiSuggestion = buildAiSuggestion(focusArea);
        double usagePct = round((monthlyEmission / zoneCap) * 100);

        String title = exceeded
                ? "Admin alert: emission limit exceeded"
                : "Admin reminder: emission limit getting close";

        String message = exceeded
                ? "You have crossed the " + zoneName + " monthly zone cap. Current emission: "
                        + round(monthlyEmission) + " kg out of " + round(zoneCap) + " kg. "
                        + "Main pressure area: " + focusArea + ". " + aiSuggestion
                : "You are at " + usagePct + "% of the " + zoneName + " monthly zone cap. Current emission: "
                        + round(monthlyEmission) + " kg out of " + round(zoneCap) + " kg. "
                        + "Main pressure area: " + focusArea + ". " + aiSuggestion;

        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setSeverity(exceeded ? "HIGH" : "MEDIUM");
        notification.setReferencePeriod(referencePeriod);
        notification.setReadStatus(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUser(user);
        notificationRepository.save(notification);

        try {
            emailService.sendEmissionAlertEmail(
                    user.getEmail(),
                    title + " - CarbonTrack",
                    buildEmailBody(user, zoneName, monthlyEmission, zoneCap, exceeded, focusArea, aiSuggestion)
            );
        } catch (Exception ex) {
            System.err.println("Emission alert email failed for " + user.getEmail() + ": " + ex.getMessage());
        }
    }

    private void createAdminNotification(
            User user,
            String title,
            String message,
            String type,
            String severity
    ) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setSeverity(severity);
        notification.setReferencePeriod(YearMonth.now().toString());
        notification.setReadStatus(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUser(user);
        notificationRepository.save(notification);
    }

    private String buildEmailBody(
            User user,
            String zoneName,
            double monthlyEmission,
            double zoneCap,
            boolean exceeded,
            String focusArea,
            String aiSuggestion
    ) {
        String opening = exceeded
                ? "Your monthly emission has exceeded the safe limit set for " + zoneName + "."
                : "Your monthly emission is getting close to the safe limit set for " + zoneName + ".";

        return "Dear " + user.getName() + ",\n\n"
                + opening + "\n\n"
                + "Current total: " + round(monthlyEmission) + " kg\n"
                + "Zone limit: " + round(zoneCap) + " kg\n"
                + "Main pressure area: " + focusArea + "\n\n"
                + "AI suggestion from admin insights:\n"
                + aiSuggestion + "\n\n"
                + "Please review your recent entries and take action this week to stay balanced in your zone.\n\n"
                + "Regards,\nCarbonTrack Admin";
    }

    private String getTopActivityLabel(User user) {
        YearMonth currentMonth = YearMonth.now();
        List<Object[]> activityTotals = carbonEntryRepository.getActivityTotalsByUserAndDateRange(
                user.getId(),
                currentMonth.atDay(1),
                currentMonth.atEndOfMonth()
        );

        if (activityTotals.isEmpty() || activityTotals.get(0)[0] == null) {
            return "overall lifestyle emissions";
        }

        ActivityType activityType = (ActivityType) activityTotals.get(0)[0];
        return formatActivity(activityType);
    }

    private String buildAiSuggestion(String focusArea) {
        return switch (focusArea.toLowerCase()) {
            case "electricity" -> "AI suggestion: reduce standby electricity waste and shift heavy appliance use away from long idle windows.";
            case "car" -> "AI suggestion: replace a few short car trips this week with bus, walking, or ride sharing.";
            case "diesel" -> "AI suggestion: combine trips and avoid idling to reduce fuel-heavy travel.";
            case "ac" -> "AI suggestion: trim AC runtime and increase the thermostat slightly during moderate hours.";
            case "waste" -> "AI suggestion: improve waste separation and reduce landfill-heavy disposal.";
            default -> "AI suggestion: focus on your biggest recent emission habit and reduce it slightly over the next few days.";
        };
    }

    private String formatActivity(ActivityType activityType) {
        return activityType.name().toLowerCase().replace('_', ' ');
    }

    private double resolveZoneCap(User user) {
        if (user.getZone() != null && user.getZone().getEmissionLimitMaxKg() != null) {
            return user.getZone().getEmissionLimitMaxKg();
        }
        return DEFAULT_ZONE_LIMIT_MAX_KG;
    }

    private String normalizeSeverity(String severity) {
        if (severity == null || severity.isBlank()) {
            return "MEDIUM";
        }
        String value = severity.trim().toUpperCase();
        if (!Objects.equals(value, "LOW")
                && !Objects.equals(value, "MEDIUM")
                && !Objects.equals(value, "HIGH")) {
            return "MEDIUM";
        }
        return value;
    }

    private boolean isDispatchAction(String actionType) {
        return "ADMIN_BROADCAST".equals(actionType)
                || "HIGH_EMITTER_INBUILT_MESSAGE".equals(actionType)
                || "HIGH_EMITTER_SELECTED_MESSAGE".equals(actionType);
    }

    private String trimTitle(String title) {
        if (title == null || title.isBlank()) {
            return "Admin message";
        }
        String trimmed = title.trim();
        return trimmed.length() <= 80 ? trimmed : trimmed.substring(0, 80) + "...";
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
