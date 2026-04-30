package com.bca.carbonfootprint.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.bca.carbonfootprint.dto.AdminAllUserResponse;
import com.bca.carbonfootprint.dto.AdminBroadcastNotificationRequest;
import com.bca.carbonfootprint.dto.ChangePasswordRequest;
import com.bca.carbonfootprint.dto.AdminDashboardResponse;
import com.bca.carbonfootprint.dto.AdminLiveMonitorResponse;
import com.bca.carbonfootprint.dto.AdminNotificationDispatchResponse;
import com.bca.carbonfootprint.dto.AdminNotificationHistoryResponse;
import com.bca.carbonfootprint.dto.AdminSelectedHighEmitterNotificationRequest;
import com.bca.carbonfootprint.dto.AdminUserStreakResponse;
import com.bca.carbonfootprint.dto.AdminUserStreakUpdateRequest;
import com.bca.carbonfootprint.dto.HighEmitterResponse;
import com.bca.carbonfootprint.dto.ZoneSectorSummaryResponse;
import com.bca.carbonfootprint.dto.ZoneUserDTO;
import com.bca.carbonfootprint.model.CarbonEntry;
import com.bca.carbonfootprint.model.AlertStatus;
import com.bca.carbonfootprint.model.EnvironmentalIssue;
import com.bca.carbonfootprint.model.IssueStatus;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.model.Zone;
import com.bca.carbonfootprint.repository.CarbonEntryRepository;
import com.bca.carbonfootprint.repository.EnvironmentalIssueRepository;
import com.bca.carbonfootprint.repository.HighEmitterAlertRepository;
import com.bca.carbonfootprint.repository.UserRepository;
import com.bca.carbonfootprint.repository.ZoneRepository;
import com.bca.carbonfootprint.service.AdminAlertService;
import com.bca.carbonfootprint.service.AdminIntelligenceService;
import com.bca.carbonfootprint.service.AdminMonitoringService;
import com.bca.carbonfootprint.service.ComplaintAnalyticsService;
import com.bca.carbonfootprint.service.NotificationService;
import com.bca.carbonfootprint.service.AdminActivityLogService;
import com.bca.carbonfootprint.service.StreakService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AdminAlertService adminAlertService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HighEmitterAlertRepository highEmitterAlertRepository;

    @Autowired
    private CarbonEntryRepository carbonEntryRepository;

    @Autowired
    private ZoneRepository zoneRepository;

    @Autowired
    private StreakService streakService;

    @Autowired
    private AdminIntelligenceService adminIntelligenceService;

    @Autowired
    private AdminMonitoringService adminMonitoringService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EnvironmentalIssueRepository environmentalIssueRepository;

    @Autowired
    private ComplaintAnalyticsService complaintAnalyticsService;

    @Autowired
    private AdminActivityLogService adminActivityLogService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public List<AdminAllUserResponse> getAllUsers() {
        LocalDate today = LocalDate.now();

        return userRepository.findAllNormalUsers().stream()
                .map(user -> {
                    Double monthlyEmission = carbonEntryRepository.getMonthlyEmission(
                            user.getId(),
                            today.getMonthValue(),
                            today.getYear()
                    );
                    CarbonEntry latestEntry = carbonEntryRepository.findTopByUser_IdOrderByDateDescIdDesc(user.getId());

                    String zoneName = resolveZoneName(user);
                    String zoneStatus = user.getZone() != null
                            ? "ASSIGNED"
                            : (zoneName != null ? "SUGGESTED" : "UNASSIGNED");

                    return new AdminAllUserResponse(
                            user.getId(),
                            user.getName(),
                            user.getEmail(),
                            user.getAddress(),
                            zoneName,
                            zoneStatus,
                            monthlyEmission != null ? monthlyEmission : 0.0,
                            latestEntry != null && latestEntry.getActivityType() != null
                                    ? latestEntry.getActivityType().name()
                                    : null,
                            latestEntry != null ? latestEntry.getCarbonAmount() : null,
                            latestEntry != null ? latestEntry.getDate() : null
                    );
                })
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/change-password")
    public ResponseEntity<?> changeAdminPassword(
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

        User admin = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), admin.getPassword())) {
            return ResponseEntity.badRequest().body("Old password incorrect");
        }

        admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(admin);
        return ResponseEntity.ok("Password changed successfully");
    }

    // ================= DASHBOARD =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/dashboard")
    public AdminDashboardResponse getAdminDashboard() {

        Long totalUsers = userRepository.countByRole_Name("ROLE_USER");

        Long highEmitters =
                highEmitterAlertRepository.countByStatus(AlertStatus.PENDING);

        Double monthlyCarbon =
                carbonEntryRepository.getTotalCarbonThisMonth();

        Long totalZones = zoneRepository.count();
        Long openComplaints = environmentalIssueRepository.countByStatus(IssueStatus.SUBMITTED)
                + environmentalIssueRepository.countByStatus(IssueStatus.UNDER_REVIEW)
                + environmentalIssueRepository.countByStatus(IssueStatus.REPORTED)
                + environmentalIssueRepository.countByStatus(IssueStatus.IN_REVIEW);
        Long criticalComplaints = environmentalIssueRepository.findAll().stream()
                .filter(issue -> !isTerminalIssue(issue))
                .filter(this::isCriticalIssue)
                .count();

        return new AdminDashboardResponse(
                totalUsers,
                highEmitters,
                monthlyCarbon != null ? monthlyCarbon : 0.0,
                totalZones,
                openComplaints,
                criticalComplaints
        );
    }

    // ================= HIGH EMITTERS =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/high-emitters")
    public List<HighEmitterResponse> getHighEmitters() {
        return adminAlertService.getPendingHighEmitters();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/notifications/broadcast")
    public AdminNotificationDispatchResponse broadcastToAllUsers(
            @RequestBody AdminBroadcastNotificationRequest request,
            Authentication authentication
    ) {
        if (request == null || request.getTitle() == null || request.getTitle().trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required.");
        }
        if (request.getMessage() == null || request.getMessage().trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message is required.");
        }

        return notificationService.broadcastToAllUsers(
                authentication != null ? authentication.getName() : "admin@system",
                request.getTitle().trim(),
                request.getMessage().trim(),
                request.getSeverity()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/notifications/high-emitters/inbuilt")
    public AdminNotificationDispatchResponse sendInbuiltHighEmitterMessage(Authentication authentication) {
        return notificationService.sendInbuiltHighEmitterMessage(
                authentication != null ? authentication.getName() : "admin@system"
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/notifications/high-emitters/selected")
    public AdminNotificationDispatchResponse sendInbuiltHighEmitterMessageToSelected(
            @RequestBody AdminSelectedHighEmitterNotificationRequest request,
            Authentication authentication
    ) {
        if (request == null || request.getUserIds() == null || request.getUserIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one selected user is required.");
        }

        return notificationService.sendInbuiltHighEmitterMessageToSelected(
                authentication != null ? authentication.getName() : "admin@system",
                request.getUserIds()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/notifications/history")
    public List<AdminNotificationHistoryResponse> getRecentNotificationHistory() {
        return notificationService.getRecentAdminDispatchHistory();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/zone-intelligence")
    public java.util.Map<String, Object> getZoneIntelligence() {
        return adminIntelligenceService.getZoneIntelligence();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/complaints/analytics")
    public java.util.Map<String, Object> getComplaintAnalytics() {
        return complaintAnalyticsService.getComplaintAnalytics();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/live-monitor")
    public AdminLiveMonitorResponse getLiveMonitor() {
        return adminMonitoringService.getLiveMonitorSnapshot();
    }

    // ================= ZONE SECTOR SUMMARY =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/zone-sector-summary")
    public List<ZoneSectorSummaryResponse> getZoneSectorSummary() {
        return adminAlertService.getZoneSectorSummary();
    }

    // ================= USERS INSIDE ZONE =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/zones/{zoneId}/users")
    public List<ZoneUserDTO> getUsersByZone(@PathVariable Long zoneId) {
        return userRepository.findUsersByZoneId(zoneId);
    }

    // ================= USER LOCATION FOR MAP =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/user/{id}")
    public ZoneUserDTO getUserLocation(@PathVariable Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Double todayEmission = carbonEntryRepository.getTodayEmissionByUser(user.getId());
        Double monthlyEmission = carbonEntryRepository.getMonthlyEmissionByUser(user.getId());

        return new ZoneUserDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getAddress(),
                todayEmission != null ? todayEmission : 0.0,
                monthlyEmission != null ? monthlyEmission : 0.0,
                user.getLatitude(),
                user.getLongitude()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users/{id}/streak")
    public AdminUserStreakResponse getUserStreakProfile(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return streakService.getAdminStreakProfile(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{id}/streak")
    public AdminUserStreakResponse updateUserStreakProfile(
            @PathVariable Long id,
            @RequestBody AdminUserStreakUpdateRequest request
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return streakService.updateAdminStreakProfile(user, request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{id}/zone/{zoneId}")
    public ResponseEntity<?> assignUserZone(
            @PathVariable Long id,
            @PathVariable Long zoneId,
            Authentication authentication
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Zone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Zone not found"));

        user.setZone(zone);
        userRepository.save(user);

        adminActivityLogService.log(
                authentication != null ? authentication.getName() : "admin@system",
                "USER_ZONE_ASSIGNMENT",
                "Assigned user " + user.getEmail() + " to zone " + zone.getName()
        );

        return ResponseEntity.ok("User assigned to " + zone.getName());
    }

    private String resolveZoneName(User user) {
        if (user.getZone() != null) {
            return user.getZone().getName();
        }

        if (user.getLatitude() == null || user.getLongitude() == null) {
            return null;
        }

        Optional<String> suggestedZone = zoneRepository.findAll().stream()
                .filter(zone ->
                        user.getLatitude() >= zone.getMinLatitude() &&
                        user.getLatitude() <= zone.getMaxLatitude() &&
                        user.getLongitude() >= zone.getMinLongitude() &&
                        user.getLongitude() <= zone.getMaxLongitude()
                )
                .map(zone -> zone.getName() + " (Suggested)")
                .findFirst();

        return suggestedZone.orElse(null);
    }

    private boolean isCriticalIssue(EnvironmentalIssue issue) {
        if (issue.getAiPriority() != null) {
            return "HIGH".equalsIgnoreCase(issue.getAiPriority())
                    || "CRITICAL".equalsIgnoreCase(issue.getAiPriority());
        }
        return issue.getSeverity() >= 4;
    }

    private boolean isTerminalIssue(EnvironmentalIssue issue) {
        return issue.getStatus() == IssueStatus.ACTION_TAKEN
                || issue.getStatus() == IssueStatus.REJECTED
                || issue.getStatus() == IssueStatus.RESOLVED;
    }
}
