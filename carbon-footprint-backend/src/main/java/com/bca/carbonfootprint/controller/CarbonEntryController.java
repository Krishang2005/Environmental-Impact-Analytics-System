package com.bca.carbonfootprint.controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.bca.carbonfootprint.dto.CarbonBreakdownResponse;
import com.bca.carbonfootprint.dto.CarbonEntryRequest;
import com.bca.carbonfootprint.dto.CarbonEntryResponse;
import com.bca.carbonfootprint.dto.ImpactSimulationRequest;
import com.bca.carbonfootprint.dto.ImpactSimulationResponse;
import com.bca.carbonfootprint.dto.QuickEntryTemplateRequest;
import com.bca.carbonfootprint.dto.QuickEntryTemplateResponse;
import com.bca.carbonfootprint.model.QuickEntryTemplate;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.repository.QuickEntryTemplateRepository;
import com.bca.carbonfootprint.repository.UserRepository;
import com.bca.carbonfootprint.service.CarbonEntryService;

@RestController
@RequestMapping("/api/carbon")
public class CarbonEntryController {

    @Autowired
    private CarbonEntryService carbonEntryService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuickEntryTemplateRepository quickEntryTemplateRepository;

    private User getLoggedUser(Principal principal) {
        return userRepository
                .findByEmail(principal.getName())
                .orElseThrow();
    }

    // ================= ADD DAILY ENTRY =================
    @PostMapping("/add")
    public CarbonEntryResponse addEntry(
            @RequestBody CarbonEntryRequest entry,
            Principal principal) {

        return carbonEntryService.addEntry(
                entry,
                getLoggedUser(principal)
        );
    }

    // ================= VIEW MY ENTRIES =================
    @GetMapping("/my")
    public List<CarbonEntryResponse> getMyEntries(
            Principal principal) {

        return carbonEntryService
                .getUserEntries(getLoggedUser(principal));
    }

    // ================= TOTAL CARBON =================
    @GetMapping("/total")
    public Double getTotal(
            Principal principal) {

        return carbonEntryService
                .getTotalCarbon(getLoggedUser(principal));
    }

    // ================= GREEN SCORE =================
    @GetMapping("/score")
    public Double getScore(
            Principal principal) {

        return carbonEntryService
                .getGreenScore(getLoggedUser(principal));
    }

    // ================= CATEGORY BREAKDOWN =================
    @GetMapping("/breakdown")
    public List<CarbonBreakdownResponse> getBreakdown(
            Principal principal) {

        return carbonEntryService
                .getCategoryBreakdown(getLoggedUser(principal));
    }

    @PostMapping("/simulate")
    public ImpactSimulationResponse simulateImpact(
            @RequestBody ImpactSimulationRequest request) {

        int frequency = Math.max(1, request.getFrequencyPerWeek());
        double currentMonthly = carbonEntryService.estimateCarbon(
                request.getActivityType(),
                request.getCurrentQuantity()
        ) * frequency * 4.33;
        double plannedMonthly = carbonEntryService.estimateCarbon(
                request.getActivityType(),
                request.getPlannedQuantity()
        ) * frequency * 4.33;
        double monthlySavings = Math.max(0, currentMonthly - plannedMonthly);
        double yearlySavings = monthlySavings * 12;

        String message = monthlySavings > 0
                ? "This change would make a visible reduction in your footprint."
                : "Adjust the planned quantity below your current usage to see a reduction scenario.";

        return new ImpactSimulationResponse(
                currentMonthly,
                plannedMonthly,
                monthlySavings,
                yearlySavings,
                yearlySavings / 21.77,
                yearlySavings / 0.21,
                message
        );
    }

    @GetMapping("/templates")
    public List<QuickEntryTemplateResponse> getTemplates(Principal principal) {
        User user = getLoggedUser(principal);
        return quickEntryTemplateRepository.findByUser_IdOrderByUseCountDescCreatedAtDesc(user.getId())
                .stream()
                .map(this::toTemplateResponse)
                .toList();
    }

    @PostMapping("/templates")
    public QuickEntryTemplateResponse createTemplate(
            @RequestBody QuickEntryTemplateRequest request,
            Principal principal
    ) {
        User user = getLoggedUser(principal);

        if (request.getName() == null || request.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Template name is required");
        }
        if (request.getActivityType() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Activity type is required");
        }
        if (request.getQuantity() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be greater than zero");
        }

        boolean exists = quickEntryTemplateRepository.existsByUser_IdAndNameIgnoreCase(
                user.getId(),
                request.getName().trim()
        );
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Template name already exists");
        }

        QuickEntryTemplate template = new QuickEntryTemplate();
        template.setUser(user);
        template.setName(request.getName().trim());
        template.setActivityType(request.getActivityType());
        template.setQuantity(request.getQuantity());
        template.setUseCount(0);
        template.setCreatedAt(LocalDateTime.now());

        QuickEntryTemplate saved = quickEntryTemplateRepository.save(template);
        return toTemplateResponse(saved);
    }

    @PostMapping("/templates/{id}/use")
    public CarbonEntryResponse useTemplate(
            @PathVariable Long id,
            Principal principal
    ) {
        User user = getLoggedUser(principal);

        QuickEntryTemplate template = quickEntryTemplateRepository
                .findByIdAndUser_Id(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Template not found"));

        CarbonEntryRequest request = new CarbonEntryRequest();
        request.setActivityType(template.getActivityType());
        request.setQuantity(template.getQuantity());

        template.setUseCount(template.getUseCount() + 1);
        template.setLastUsedAt(LocalDateTime.now());
        quickEntryTemplateRepository.save(template);

        return carbonEntryService.addEntry(request, user);
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<?> deleteTemplate(
            @PathVariable Long id,
            Principal principal
    ) {
        User user = getLoggedUser(principal);

        QuickEntryTemplate template = quickEntryTemplateRepository
                .findByIdAndUser_Id(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Template not found"));

        quickEntryTemplateRepository.delete(template);
        return ResponseEntity.ok("Template deleted");
    }

    // ================= USER MONTHLY CSV =================
    @GetMapping("/download-monthly")
    public ResponseEntity<byte[]> downloadMonthlyReport(
            @RequestParam int year,
            @RequestParam int month,
            Principal principal) {

        User user = getLoggedUser(principal);

        byte[] csvData =
                carbonEntryService.generateMonthlyCsv(user, year, month);

        String filename = "carbon_report_" + year + "_" + month + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    // ================= ADMIN MONTHLY CSV =================
    @GetMapping("/admin/download-monthly")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> downloadAdminMonthlyReport(
            @RequestParam int year,
            @RequestParam int month) {

        byte[] csvData =
                carbonEntryService.generateAdminMonthlyCsv(year, month);

        String filename = "admin_carbon_report_" + year + "_" + month + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    @GetMapping("/download-monthly-pdf")
    public ResponseEntity<byte[]> downloadMonthlyPdfReport(
            @RequestParam int year,
            @RequestParam int month,
            Principal principal) {

        User user = getLoggedUser(principal);
        byte[] pdfData = carbonEntryService.generateMonthlyPdf(user, year, month);
        String filename = "carbon_report_" + year + "_" + month + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfData);
    }

    private QuickEntryTemplateResponse toTemplateResponse(QuickEntryTemplate template) {
        return new QuickEntryTemplateResponse(
                template.getId(),
                template.getName(),
                template.getActivityType().name(),
                template.getQuantity(),
                template.getUseCount(),
                template.getCreatedAt(),
                template.getLastUsedAt()
        );
    }
}
