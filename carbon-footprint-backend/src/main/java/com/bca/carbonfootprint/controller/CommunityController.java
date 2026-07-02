package com.bca.carbonfootprint.controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.bca.carbonfootprint.dto.EnvironmentalIssueRequest;
import com.bca.carbonfootprint.dto.EnvironmentalIssueResponse;
import com.bca.carbonfootprint.dto.IssueStatusUpdateRequest;
import com.bca.carbonfootprint.dto.IssueTimelineItemResponse;
import com.bca.carbonfootprint.model.EnvironmentalIssue;
import com.bca.carbonfootprint.model.IssueFollower;
import com.bca.carbonfootprint.model.IssueStatus;
import com.bca.carbonfootprint.model.IssueStatusHistory;
import com.bca.carbonfootprint.model.IssueVote;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.model.Zone;
import com.bca.carbonfootprint.repository.EnvironmentalIssueRepository;
import com.bca.carbonfootprint.repository.IssueFollowerRepository;
import com.bca.carbonfootprint.repository.IssueStatusHistoryRepository;
import com.bca.carbonfootprint.repository.IssueVoteRepository;
import com.bca.carbonfootprint.repository.UserRepository;
import com.bca.carbonfootprint.service.AdminActivityLogService;
import com.bca.carbonfootprint.service.EmailService;
import com.bca.carbonfootprint.service.NotificationService;
import com.bca.carbonfootprint.service.RewardService;
import com.bca.carbonfootprint.service.ZoneDetectorService;

@RestController
@RequestMapping("/api/community")
public class CommunityController {

    private static final int MAX_REPORTS_PER_24H = 5;
    private static final int MAX_EVIDENCE_DATA_URL_LENGTH = 2_800_000;
    private static final Set<String> ALLOWED_MEDIA_TYPES = Set.of("PHOTO", "VIDEO");
    private static final Set<String> ALLOWED_IMAGE_DATA_URL_PREFIXES = Set.of(
            "data:image/jpeg;base64,",
            "data:image/jpg;base64,",
            "data:image/png;base64,",
            "data:image/webp;base64,"
    );
    private static final Set<String> BLOCKED_TERMS = Set.of(
            "http://", "https://", "win money", "loan offer", "crypto giveaway"
    );

    private final EnvironmentalIssueRepository environmentalIssueRepository;
    private final IssueVoteRepository issueVoteRepository;
    private final IssueFollowerRepository issueFollowerRepository;
    private final IssueStatusHistoryRepository issueStatusHistoryRepository;
    private final UserRepository userRepository;
    private final RewardService rewardService;
    private final ZoneDetectorService zoneDetectorService;
    private final AdminActivityLogService adminActivityLogService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final String bbmpComplaintEmail;

    public CommunityController(
            EnvironmentalIssueRepository environmentalIssueRepository,
            IssueVoteRepository issueVoteRepository,
            IssueFollowerRepository issueFollowerRepository,
            IssueStatusHistoryRepository issueStatusHistoryRepository,
            UserRepository userRepository,
            RewardService rewardService,
            ZoneDetectorService zoneDetectorService,
            AdminActivityLogService adminActivityLogService,
            NotificationService notificationService,
            EmailService emailService,
            @Value("${app.bbmp.complaint-email:}") String bbmpComplaintEmail) {
        this.environmentalIssueRepository = environmentalIssueRepository;
        this.issueVoteRepository = issueVoteRepository;
        this.issueFollowerRepository = issueFollowerRepository;
        this.issueStatusHistoryRepository = issueStatusHistoryRepository;
        this.userRepository = userRepository;
        this.rewardService = rewardService;
        this.zoneDetectorService = zoneDetectorService;
        this.adminActivityLogService = adminActivityLogService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.bbmpComplaintEmail = bbmpComplaintEmail;
    }

    @GetMapping("/issues")
    public List<EnvironmentalIssueResponse> getIssues(Principal principal) {
        User user = getLoggedUser(principal);
        return environmentalIssueRepository.findAllByOrderByReportedAtDesc()
                .stream()
                .map(issue -> toResponse(issue, user.getId()))
                .toList();
    }

    @GetMapping("/issues/mine")
    public List<EnvironmentalIssueResponse> getMyIssues(Principal principal) {
        User user = getLoggedUser(principal);
        return environmentalIssueRepository.findByReporter_IdOrderByReportedAtDesc(user.getId())
                .stream()
                .map(issue -> toResponse(issue, user.getId()))
                .toList();
    }

    @PostMapping("/issues")
    @ResponseStatus(HttpStatus.CREATED)
    public EnvironmentalIssueResponse createIssue(
            @RequestBody EnvironmentalIssueRequest request,
            Principal principal) {
        User reporter = getLoggedUser(principal);
        validateIssuePayload(request);
        enforceReportRateLimit(reporter);

        Double issueLatitude = request.getLatitude() != null ? request.getLatitude() : reporter.getLatitude();
        Double issueLongitude = request.getLongitude() != null ? request.getLongitude() : reporter.getLongitude();
        Zone mappedZone = issueLatitude != null && issueLongitude != null
                ? zoneDetectorService.detectZone(issueLatitude, issueLongitude)
                : reporter.getZone();

        EnvironmentalIssue issue = new EnvironmentalIssue();
        issue.setTitle(resolveTitle(request, mappedZone));
        issue.setDescription(resolveDescription(request));
        issue.setIssueType(request.getIssueType());
        issue.setSeverity(resolveSeverity(request));
        issue.setLatitude(issueLatitude);
        issue.setLongitude(issueLongitude);
        issue.setAddress(request.getAddress() != null && !request.getAddress().isBlank()
                ? request.getAddress()
                : reporter.getAddress());
        issue.setMappedZoneName(request.getMappedZoneName() != null && !request.getMappedZoneName().isBlank()
                ? request.getMappedZoneName().trim()
                : mappedZone != null ? mappedZone.getName() : reporter.getZone() != null ? reporter.getZone().getName() : "Unassigned");
        issue.setCaptureTimestamp(request.getCaptureTimestamp() != null ? request.getCaptureTimestamp() : LocalDateTime.now());
        issue.setMediaType(request.getMediaType());
        issue.setDetectionModel(request.getDetectionModel());
        issue.setOnDeviceInference(Boolean.TRUE.equals(request.getOnDeviceInference()));
        issue.setSmokeColor(request.getSmokeColor());
        issue.setWasteType(request.getWasteType());
        issue.setAiSeverityLabel(request.getAiSeverityLabel());
        issue.setAiPriority(request.getAiPriority());
        issue.setMediaDurationSeconds(request.getMediaDurationSeconds());
        issue.setAiScore(request.getAiScore());
        issue.setAiConfidenceScore(resolveConfidenceScore(request));
        issue.setRollingAverageScore(request.getRollingAverageScore());
        issue.setEstimatedCarbonGrams(resolveEstimatedCarbonGrams(request));
        issue.setCarbonEstimateLabel(resolveCarbonEstimateLabel(request, issue.getEstimatedCarbonGrams()));
        issue.setCarbonEstimateMethod(resolveCarbonEstimateMethod(request));
        issue.setVehicleCount(request.getVehicleCount());
        issue.setFrameSampleCount(request.getFrameSampleCount());
        issue.setVehiclePlateNumber(normalizePlateNumber(request.getVehiclePlateNumber()));
        issue.setAiSummary(request.getAiSummary());
        issue.setEvidenceImageUrl(request.getEvidenceImageUrl());
        issue.setStatus(IssueStatus.SUBMITTED);
        issue.setReportedAt(LocalDateTime.now());
        issue.setReporter(reporter);

        EnvironmentalIssue saved = environmentalIssueRepository.save(issue);
        createHistory(saved, null, IssueStatus.SUBMITTED, "Issue submitted", null, reporter.getName());

        rewardService.awardPoints(
                reporter,
                "ISSUE_REPORTED",
                "ISSUE_" + saved.getId(),
                20,
                "Reported a local environmental issue"
        );

        return toResponse(saved, reporter.getId());
    }

    @PutMapping("/issues/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public EnvironmentalIssueResponse updateIssueStatus(
            @PathVariable Long id,
            @RequestParam IssueStatus status,
            @RequestBody(required = false) IssueStatusUpdateRequest request,
            Principal principal) {
        User admin = getLoggedUser(principal);
        EnvironmentalIssue issue = environmentalIssueRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found"));

        IssueStatus previousStatus = issue.getStatus();
        IssueStatus normalizedStatus = normalizeRequestedStatus(status);
        validateStatusTransition(previousStatus, normalizedStatus);
        issue.setStatus(normalizedStatus);
        if (normalizedStatus == IssueStatus.ACTION_TAKEN) {
            issue.setResolvedAt(LocalDateTime.now());
            if (request != null) {
                validateImageDataUrl(request.getProofImageUrl(), "Proof image");
                issue.setProofImageUrl(request.getProofImageUrl());
                issue.setResolutionNote(request.getNote());
            }
        } else {
            issue.setResolvedAt(null);
        }

        EnvironmentalIssue saved = environmentalIssueRepository.save(issue);
        createHistory(
                saved,
                previousStatus,
                normalizedStatus,
                request != null ? request.getNote() : null,
                request != null ? request.getProofImageUrl() : null,
                admin.getName()
        );

        adminActivityLogService.log(
                admin.getEmail(),
                "ISSUE_STATUS_UPDATE",
                "Changed issue #" + saved.getId() + " from " + previousStatus + " to " + normalizedStatus
        );
        notificationService.notifyComplaintStatusChange(issue.getReporter(), saved, previousStatus, normalizedStatus);

        if (normalizedStatus == IssueStatus.ACTION_TAKEN) {
            rewardService.awardPoints(
                    issue.getReporter(),
                    "ISSUE_RESOLVED",
                    "ISSUE_" + issue.getId(),
                    40,
                    "Issue marked resolved by admin"
            );
        }

        return toResponse(saved, admin.getId());
    }

    @PostMapping("/issues/{id}/escalate-bbmp")
    @PreAuthorize("hasRole('ADMIN')")
    public EnvironmentalIssueResponse escalateToBbmp(
            @PathVariable Long id,
            @RequestParam(defaultValue = "24") int deadlineHours,
            Principal principal) {
        User admin = getLoggedUser(principal);
        EnvironmentalIssue issue = environmentalIssueRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found"));

        IssueStatus previousStatus = issue.getStatus();
        IssueStatus nextStatus = previousStatus == IssueStatus.SUBMITTED
                ? IssueStatus.UNDER_REVIEW
                : previousStatus;
        LocalDateTime deadline = LocalDateTime.now().plusHours(Math.max(1, Math.min(72, deadlineHours)));

        if (nextStatus != previousStatus) {
            issue.setStatus(nextStatus);
            issue.setResolvedAt(null);
        }

        EnvironmentalIssue saved = environmentalIssueRepository.save(issue);

        boolean emailConfigured = bbmpComplaintEmail != null && !bbmpComplaintEmail.isBlank();
        String note;

        if (emailConfigured) {
            note = "Escalated to BBMP at " + bbmpComplaintEmail
                    + ". Requested response by " + deadline
                    + ". Admin must verify field action before marking action taken.";

            try {
                emailService.sendEmissionAlertEmail(
                        bbmpComplaintEmail,
                        "BBMP Escalation: Complaint #" + saved.getId() + " - " + saved.getTitle(),
                        buildBbmpEscalationEmail(saved, admin, deadline)
                );
            } catch (Exception ex) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Could not send BBMP escalation email: " + ex.getMessage()
                );
            }
        } else {
            note = "Marked for BBMP escalation with a " + deadlineHours
                    + "-hour response target. BBMP email is not configured, so no email was sent.";
        }

        createHistory(saved, previousStatus, nextStatus, note, null, admin.getName());
        adminActivityLogService.log(
                admin.getEmail(),
                "ISSUE_BBMP_ESCALATION",
                "Escalated issue #" + saved.getId() + " to BBMP with deadline " + deadline
        );

        return toResponse(saved, admin.getId());
    }

    private IssueStatus normalizeRequestedStatus(IssueStatus status) {
        if (status == IssueStatus.REPORTED) {
            return IssueStatus.SUBMITTED;
        }
        if (status == IssueStatus.IN_REVIEW) {
            return IssueStatus.UNDER_REVIEW;
        }
        if (status == IssueStatus.RESOLVED) {
            return IssueStatus.ACTION_TAKEN;
        }
        return status;
    }

    private void validateStatusTransition(IssueStatus previousStatus, IssueStatus nextStatus) {
        IssueStatus previous = normalizeRequestedStatus(previousStatus);
        boolean valid = previous == nextStatus
                || (previous == IssueStatus.SUBMITTED && nextStatus == IssueStatus.UNDER_REVIEW)
                || (previous == IssueStatus.UNDER_REVIEW && (nextStatus == IssueStatus.ACTION_TAKEN || nextStatus == IssueStatus.REJECTED));

        if (!valid) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid complaint workflow transition. Use Submitted -> Under Review -> Action Taken or Rejected."
            );
        }
    }

    @PostMapping("/issues/{id}/upvote")
    public Map<String, Object> toggleUpvote(
            @PathVariable Long id,
            Principal principal
    ) {
        User user = getLoggedUser(principal);
        EnvironmentalIssue issue = environmentalIssueRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found"));

        boolean upvoted;
        IssueVote existing = issueVoteRepository.findByIssue_IdAndUser_Id(issue.getId(), user.getId()).orElse(null);
        if (existing != null) {
            issueVoteRepository.delete(existing);
            upvoted = false;
        } else {
            IssueVote vote = new IssueVote();
            vote.setIssue(issue);
            vote.setUser(user);
            vote.setCreatedAt(LocalDateTime.now());
            issueVoteRepository.save(vote);
            upvoted = true;
        }

        return Map.of(
                "upvoted", upvoted,
                "upvoteCount", issueVoteRepository.countByIssue_Id(id)
        );
    }

    @PostMapping("/issues/{id}/follow")
    public Map<String, Object> toggleFollow(
            @PathVariable Long id,
            Principal principal
    ) {
        User user = getLoggedUser(principal);
        EnvironmentalIssue issue = environmentalIssueRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found"));

        boolean followed;
        IssueFollower existing = issueFollowerRepository.findByIssue_IdAndUser_Id(issue.getId(), user.getId()).orElse(null);
        if (existing != null) {
            issueFollowerRepository.delete(existing);
            followed = false;
        } else {
            IssueFollower follower = new IssueFollower();
            follower.setIssue(issue);
            follower.setUser(user);
            follower.setCreatedAt(LocalDateTime.now());
            issueFollowerRepository.save(follower);
            followed = true;
        }

        return Map.of(
                "followed", followed,
                "followerCount", issueFollowerRepository.countByIssue_Id(id)
        );
    }

    private User getLoggedUser(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void validateIssuePayload(EnvironmentalIssueRequest request) {
        if (request.getDescription() == null || request.getDescription().isBlank()) {
            if (request.getAiSummary() == null || request.getAiSummary().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Issue description or AI summary is required");
            }
        }
        if (request.getIssueType() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Issue type is required");
        }
        validateMediaType(request.getMediaType());
        validateImageDataUrl(request.getEvidenceImageUrl(), "Evidence image");
        if (containsBlockedContent(defaultString(request.getTitle())) || containsBlockedContent(defaultString(request.getDescription()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Issue content looks like spam. Please revise.");
        }
    }

    private void validateMediaType(String mediaType) {
        if (mediaType == null || mediaType.isBlank()) {
            return;
        }
        if (!ALLOWED_MEDIA_TYPES.contains(mediaType.trim().toUpperCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported media type");
        }
    }

    private void validateImageDataUrl(String dataUrl, String label) {
        if (dataUrl == null || dataUrl.isBlank()) {
            return;
        }
        String normalized = dataUrl.trim().toLowerCase();
        boolean allowedPrefix = ALLOWED_IMAGE_DATA_URL_PREFIXES.stream().anyMatch(normalized::startsWith);
        if (!allowedPrefix) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " must be a JPEG, PNG, or WebP data URL");
        }
        if (dataUrl.length() > MAX_EVIDENCE_DATA_URL_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is too large. Maximum allowed size is about 2 MB");
        }
    }

    private void enforceReportRateLimit(User reporter) {
        long reportCount = environmentalIssueRepository.countByReporter_IdAndReportedAtAfter(
                reporter.getId(),
                LocalDateTime.now().minusHours(24)
        );
        if (reportCount >= MAX_REPORTS_PER_24H) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Daily report limit reached. Try again later."
            );
        }
    }

    private boolean containsBlockedContent(String text) {
        String normalized = text.toLowerCase();
        return BLOCKED_TERMS.stream().anyMatch(normalized::contains);
    }

    private int resolveSeverity(EnvironmentalIssueRequest request) {
        if (request.getSeverity() != null) {
            return Math.max(1, Math.min(5, request.getSeverity()));
        }
        if (request.getAiScore() != null) {
            int derivedSeverity = (int) Math.ceil(request.getAiScore() / 20.0);
            return Math.max(1, Math.min(5, derivedSeverity));
        }
        return 3;
    }

    private double resolveConfidenceScore(EnvironmentalIssueRequest request) {
        if (request.getAiConfidenceScore() != null) {
            return roundConfidence(request.getAiConfidenceScore());
        }

        double confidence = 35;
        if (request.getAiScore() != null) {
            confidence += Math.min(28, request.getAiScore() * 0.22);
        }
        if (request.getFrameSampleCount() != null) {
            confidence += Math.min(18, request.getFrameSampleCount() * 0.9);
        }
        if (request.getEvidenceImageUrl() != null && !request.getEvidenceImageUrl().isBlank()) {
            confidence += 10;
        }
        if (request.getLatitude() != null && request.getLongitude() != null) {
            confidence += 6;
        }
        if (request.getVehiclePlateNumber() != null && !request.getVehiclePlateNumber().isBlank()) {
            confidence += 6;
        }
        return roundConfidence(confidence);
    }

    private double resolveEstimatedCarbonGrams(EnvironmentalIssueRequest request) {
        if (request.getEstimatedCarbonGrams() != null) {
            return roundMetric(request.getEstimatedCarbonGrams());
        }
        if (request.getIssueType() != com.bca.carbonfootprint.model.IssueType.AIR_POLLUTION) {
            return 0;
        }

        double durationSeconds = request.getMediaDurationSeconds() != null
                ? Math.max(1, request.getMediaDurationSeconds())
                : Math.max(1, safeNumber(request.getFrameSampleCount()) * 0.7);
        double score = request.getAiScore() != null ? request.getAiScore() : 0;
        double smokeMultiplier = switch (defaultString(request.getSmokeColor()).toUpperCase()) {
            case "BLACK" -> 1.45;
            case "GREY" -> 1.2;
            case "WHITE" -> 0.95;
            default -> 1.0;
        };
        double vehicleMultiplier = Math.max(1, safeNumber(request.getVehicleCount()));
        double gramsPerMinute = (110 + (score * 5.2)) * smokeMultiplier * vehicleMultiplier;
        return roundMetric(gramsPerMinute * (durationSeconds / 60.0));
    }

    private String resolveCarbonEstimateLabel(EnvironmentalIssueRequest request, double estimatedCarbonGrams) {
        if (request.getCarbonEstimateLabel() != null && !request.getCarbonEstimateLabel().isBlank()) {
            return request.getCarbonEstimateLabel().trim();
        }
        if (request.getIssueType() != com.bca.carbonfootprint.model.IssueType.AIR_POLLUTION) {
            return "Not applicable";
        }
        if (estimatedCarbonGrams >= 450) {
            return "Very High Visual Carbon Estimate";
        }
        if (estimatedCarbonGrams >= 250) {
            return "High Visual Carbon Estimate";
        }
        if (estimatedCarbonGrams >= 120) {
            return "Moderate Visual Carbon Estimate";
        }
        return "Low Visual Carbon Estimate";
    }

    private String resolveCarbonEstimateMethod(EnvironmentalIssueRequest request) {
        if (request.getCarbonEstimateMethod() != null && !request.getCarbonEstimateMethod().isBlank()) {
            return request.getCarbonEstimateMethod().trim();
        }
        return "Visual approximation from smoke severity, duration, and vehicle count. Not a sensor-grade carbon measurement.";
    }

    private String resolveTitle(EnvironmentalIssueRequest request, Zone mappedZone) {
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            return request.getTitle().trim();
        }
        String zoneName = request.getMappedZoneName() != null && !request.getMappedZoneName().isBlank()
                ? request.getMappedZoneName().trim()
                : mappedZone != null ? mappedZone.getName() : "city zone";
        return switch (request.getIssueType()) {
            case AIR_POLLUTION -> "Vehicle emission alert detected in " + zoneName;
            case WASTE_DUMPING -> "Garbage accumulation reported in " + zoneName;
            default -> "Civic issue reported in " + zoneName;
        };
    }

    private String resolveDescription(EnvironmentalIssueRequest request) {
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            return request.getDescription().trim();
        }
        return request.getAiSummary().trim();
    }

    private String normalizePlateNumber(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase();
    }

    private String buildBbmpEscalationEmail(EnvironmentalIssue issue, User admin, LocalDateTime deadline) {
        String coordinates = issue.getLatitude() != null && issue.getLongitude() != null
                ? issue.getLatitude() + ", " + issue.getLongitude()
                : "Not provided";
        String zoneName = issue.getMappedZoneName() != null && !issue.getMappedZoneName().isBlank()
                ? issue.getMappedZoneName()
                : issue.getReporter().getZone() != null ? issue.getReporter().getZone().getName() : "Unassigned";

        return "Dear BBMP Team,\n\n"
                + "A civic complaint has been verified by the CarbonTrack Nexus admin dashboard and requires field action.\n\n"
                + "Complaint ID: #" + issue.getId() + "\n"
                + "Title: " + issue.getTitle() + "\n"
                + "Type: " + issue.getIssueType().name() + "\n"
                + "Priority: " + defaultString(issue.getAiPriority()) + "\n"
                + "AI Score: " + safeText(issue.getAiScore()) + "/100\n"
                + "Confidence: " + safeText(issue.getAiConfidenceScore()) + "/100\n"
                + "Zone: " + zoneName + "\n"
                + "Address / Landmark: " + defaultString(issue.getAddress()) + "\n"
                + "Coordinates: " + coordinates + "\n"
                + "Reported At: " + issue.getReportedAt() + "\n"
                + "Response Requested By: " + deadline + "\n\n"
                + "Description:\n" + issue.getDescription() + "\n\n"
                + "Evidence is available in the CarbonTrack Nexus admin complaint dashboard. "
                + "Please inspect the location, take corrective action, and share the action taken status.\n\n"
                + "Escalated by: " + admin.getName() + " (" + admin.getEmail() + ")\n\n"
                + "Regards,\nCarbonTrack Nexus Admin Team";
    }

    private String safeText(Number value) {
        return value != null ? String.valueOf(value) : "N/A";
    }

    private String defaultString(String value) {
        return value != null ? value : "";
    }

    private double roundConfidence(double value) {
        return Math.max(0, Math.min(100, Math.round(value * 10.0) / 10.0));
    }

    private double roundMetric(double value) {
        return Math.max(0, Math.round(value * 10.0) / 10.0);
    }

    private double safeNumber(Number value) {
        return value != null ? value.doubleValue() : 0;
    }

    private void createHistory(
            EnvironmentalIssue issue,
            IssueStatus previousStatus,
            IssueStatus newStatus,
            String note,
            String proofImageUrl,
            String changedBy
    ) {
        IssueStatusHistory history = new IssueStatusHistory();
        history.setIssue(issue);
        history.setPreviousStatus(previousStatus);
        history.setNewStatus(newStatus);
        history.setNote(note);
        history.setProofImageUrl(proofImageUrl);
        history.setChangedBy(changedBy);
        history.setChangedAt(LocalDateTime.now());
        issueStatusHistoryRepository.save(history);
    }

    private EnvironmentalIssueResponse toResponse(EnvironmentalIssue issue, Long currentUserId) {
        long upvoteCount = issueVoteRepository.countByIssue_Id(issue.getId());
        long followerCount = issueFollowerRepository.countByIssue_Id(issue.getId());
        boolean upvotedByMe = issueVoteRepository.existsByIssue_IdAndUser_Id(issue.getId(), currentUserId);
        boolean followedByMe = issueFollowerRepository.existsByIssue_IdAndUser_Id(issue.getId(), currentUserId);
        List<IssueTimelineItemResponse> timeline = issueStatusHistoryRepository.findByIssue_IdOrderByChangedAtAsc(issue.getId())
                .stream()
                .map(item -> new IssueTimelineItemResponse(
                        item.getPreviousStatus() != null ? item.getPreviousStatus().name() : null,
                        item.getNewStatus().name(),
                        item.getNote(),
                        item.getProofImageUrl(),
                        item.getChangedAt(),
                        item.getChangedBy()
                ))
                .toList();

        return new EnvironmentalIssueResponse(
                issue.getId(),
                issue.getTitle(),
                issue.getDescription(),
                issue.getIssueType().name(),
                issue.getSeverity(),
                issue.getLatitude(),
                issue.getLongitude(),
                issue.getAddress(),
                issue.getMappedZoneName(),
                issue.getStatus().name(),
                issue.getReportedAt(),
                issue.getResolvedAt(),
                issue.getCaptureTimestamp(),
                issue.getReporter().getName(),
                issue.getMappedZoneName() != null && !issue.getMappedZoneName().isBlank()
                        ? issue.getMappedZoneName()
                        : issue.getReporter().getZone() != null ? issue.getReporter().getZone().getName() : "Unassigned",
                (int) upvoteCount,
                (int) followerCount,
                upvotedByMe,
                followedByMe,
                issue.getEvidenceImageUrl(),
                issue.getProofImageUrl(),
                issue.getResolutionNote(),
                issue.getMediaType(),
                issue.getDetectionModel(),
                issue.getOnDeviceInference(),
                issue.getSmokeColor(),
                issue.getWasteType(),
                issue.getAiSeverityLabel(),
                issue.getAiPriority(),
                issue.getMediaDurationSeconds(),
                issue.getAiScore(),
                issue.getAiConfidenceScore(),
                issue.getRollingAverageScore(),
                issue.getEstimatedCarbonGrams(),
                issue.getCarbonEstimateLabel(),
                issue.getCarbonEstimateMethod(),
                issue.getVehicleCount(),
                issue.getFrameSampleCount(),
                issue.getVehiclePlateNumber(),
                issue.getAiSummary(),
                timeline
        );
    }
}
