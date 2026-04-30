package com.bca.carbonfootprint.service.impl;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import com.bca.carbonfootprint.dto.CarbonBreakdownResponse;
import com.bca.carbonfootprint.dto.CarbonEntryRequest;
import com.bca.carbonfootprint.dto.CarbonEntryResponse;
import com.bca.carbonfootprint.model.ActivityType;
import com.bca.carbonfootprint.model.CarbonEntry;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.repository.CarbonEntryRepository;
import com.bca.carbonfootprint.service.AdminAlertService;
import com.bca.carbonfootprint.service.CarbonEntryService;
import com.bca.carbonfootprint.service.MissionService;
import com.bca.carbonfootprint.service.NotificationService;
import com.bca.carbonfootprint.service.RewardService;

@Service
public class CarbonEntryServiceImpl implements CarbonEntryService {

    @Autowired
    private CarbonEntryRepository carbonEntryRepository;

    @Autowired
    private AdminAlertService adminAlertService;

    @Autowired
    private RewardService rewardService;

    @Autowired
    private MissionService missionService;

    @Autowired
    private NotificationService notificationService;

    @Override
    public CarbonEntryResponse addEntry(CarbonEntryRequest entry, User user) {

        CarbonEntry carbonEntry = new CarbonEntry();
        carbonEntry.setActivityType(entry.getActivityType());
        carbonEntry.setQuantity(entry.getQuantity());

        double carbon = calculateCarbon(
                carbonEntry.getActivityType(),
                carbonEntry.getQuantity()
        );

        carbonEntry.setCarbonAmount(carbon);
        carbonEntry.setCo2Amount(carbon);
        carbonEntry.setUser(user);
        carbonEntry.setDate(LocalDate.now());
        carbonEntry.setCreatedAt(LocalDateTime.now());

        CarbonEntry saved = carbonEntryRepository.save(carbonEntry);

        int year = LocalDate.now().getYear();
        int month = LocalDate.now().getMonthValue();

        Double monthlyTotal = carbonEntryRepository
                .getMonthlyEmission(user.getId(), month, year);

        adminAlertService.checkAndCreateAlert(
                user.getId(),
                monthlyTotal
        );
        notificationService.evaluateEmissionStatus(user, monthlyTotal != null ? monthlyTotal : 0.0);

        rewardService.awardPoints(
                user,
                "DAILY_LOG",
                LocalDate.now().toString(),
                2,
                "Logged daily carbon activity"
        );
        missionService.updateCurrentMissionProgress(user);

        return toResponse(saved);
    }

    private double calculateCarbon(ActivityType type, double quantity) {

        return switch (type) {
            case ELECTRICITY -> quantity * 0.82;
            case LPG -> quantity * 3.0;
            case DIESEL -> quantity * 2.68;
            case PETROL -> quantity * 2.31;
            case CNG -> quantity * 2.75;
            case CAR -> quantity * 0.21;
            case BIKE -> quantity * 0.08;
            case BUS -> quantity * 0.105;
            case TRAIN -> quantity * 0.041;
            case FLIGHT -> quantity * 0.255;
            case AC -> quantity * 1.5;
            case COAL -> quantity * 2.4;
            case CEMENT -> quantity * 0.93;
            case STEEL -> quantity * 1.85;
            case WASTE -> quantity * 0.5;
            case INDUSTRIAL_WASTE -> quantity * 1.2;
            case GENERATOR -> quantity * 2.68;
            case PNG -> quantity * 2.75;
            case KEROSENE -> quantity * 2.5;
            case NATURAL_GAS -> quantity * 2.75;
            case PUBLIC_TRANSPORT -> quantity * 0.09;
            case OTHER -> quantity * 0.5;
        };
    }

    @Override
    public Double estimateCarbon(ActivityType type, double quantity) {
        return calculateCarbon(type, quantity);
    }

    @Override
    public List<CarbonEntryResponse> getUserEntries(User user) {
        return carbonEntryRepository.findByUser(user)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Double getTotalCarbon(User user) {

        Double total = carbonEntryRepository
                .getMonthlyEmission(user.getId(),
                        LocalDate.now().getMonthValue(),
                        LocalDate.now().getYear());

        return total != null ? total : 0.0;
    }

    @Override
    public Double getGreenScore(User user) {

        Double total = getTotalCarbon(user);

        return total == 0
                ? 100.0
                : Math.max(0, 100 - (total / 10));
    }

    @Override
    public List<CarbonBreakdownResponse> getCategoryBreakdown(User user) {
        Map<String, Double> totals = carbonEntryRepository.findByUser(user)
                .stream()
                .collect(Collectors.groupingBy(
                        e -> e.getActivityType().name(),
                        Collectors.summingDouble(CarbonEntry::getCarbonAmount)
                ));

        return totals.entrySet()
                .stream()
                .map(entry -> new CarbonBreakdownResponse(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }

    @Override
    public Double getMonthlyCarbon(User user, int year, int month) {

        Double total = carbonEntryRepository
                .getMonthlyEmission(user.getId(), month, year);

        return total != null ? total : 0.0;
    }

    @Override
    public Map<String, Double> getYearlyTrend(User user, int year) {

        Map<String, Double> data = new HashMap<>();

        for (int month = 1; month <= 12; month++) {

            Double value = carbonEntryRepository
                    .getMonthlyEmission(user.getId(), month, year);

            data.put(
                    String.valueOf(month),
                    value != null ? value : 0.0
            );
        }

        return data;
    }

    @Override
    public byte[] generateMonthlyCsv(User user, int year, int month) {

        YearMonth ym = YearMonth.of(year, month);

        List<CarbonEntry> entries =
                carbonEntryRepository.findByUserAndDateBetween(
                        user,
                        ym.atDay(1),
                        ym.atEndOfMonth()
                );

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(out);

        writer.println("Date,Activity Type,Quantity,Carbon Amount (kg)");

        double total = 0;

        for (CarbonEntry entry : entries) {

            writer.println(
                    entry.getDate() + ","
                    + entry.getActivityType().name() + ","
                    + entry.getQuantity() + ","
                    + entry.getCarbonAmount()
            );

            total += entry.getCarbonAmount();
        }

        writer.println();
        writer.println("Total (kg):," + total);

        writer.flush();
        return out.toByteArray();
    }

    @Override
    public byte[] generateMonthlyPdf(User user, int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        List<CarbonEntry> entries = carbonEntryRepository.findByUserAndDateBetween(
                user,
                ym.atDay(1),
                ym.atEndOfMonth()
        );

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD);
            Font smallFont = new Font(Font.HELVETICA, 10);

            Paragraph title = new Paragraph("CarbonTrack Monthly Carbon Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph("User: " + user.getName() + " (" + user.getEmail() + ")", smallFont));
            document.add(new Paragraph("Period: " + ym, smallFont));
            document.add(new Paragraph("Zone: " + (user.getZone() != null ? user.getZone().getName() : "Unassigned"), smallFont));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            addHeader(table, "Date");
            addHeader(table, "Activity");
            addHeader(table, "Quantity");
            addHeader(table, "Carbon (kg)");

            double total = 0;
            for (CarbonEntry entry : entries) {
                table.addCell(String.valueOf(entry.getDate()));
                table.addCell(entry.getActivityType().name());
                table.addCell(String.valueOf(entry.getQuantity()));
                table.addCell(String.format("%.2f", entry.getCarbonAmount()));
                total += entry.getCarbonAmount();
            }
            document.add(table);
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Total monthly emission: " + String.format("%.2f", total) + " kg CO2e"));
            document.add(new Paragraph("Generated by CarbonTrack Nexus. Values are calculated estimates for awareness and planning.", smallFont));
        } catch (Exception ex) {
            throw new IllegalStateException("Could not generate monthly PDF report", ex);
        } finally {
            document.close();
        }

        return out.toByteArray();
    }

    private void addHeader(PdfPTable table, String label) {
        PdfPCell cell = new PdfPCell(new Phrase(label));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    @Override
    public byte[] generateAdminMonthlyCsv(int year, int month) {

        YearMonth ym = YearMonth.of(year, month);

        List<CarbonEntry> entries =
                carbonEntryRepository.findByDateBetween(
                        ym.atDay(1),
                        ym.atEndOfMonth()
                );

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(out);

        writer.println("User Email,Date,Activity Type,Quantity,Carbon Amount (kg)");

        double total = 0;

        for (CarbonEntry entry : entries) {

            writer.println(
                    entry.getUser().getEmail() + ","
                    + entry.getDate() + ","
                    + entry.getActivityType().name() + ","
                    + entry.getQuantity() + ","
                    + entry.getCarbonAmount()
            );

            total += entry.getCarbonAmount();
        }

        writer.println();
        writer.println("GRAND TOTAL (kg):," + total);

        writer.flush();
        return out.toByteArray();
    }

    private CarbonEntryResponse toResponse(CarbonEntry entry) {
        return new CarbonEntryResponse(
                entry.getId(),
                entry.getActivityType().name(),
                entry.getQuantity(),
                entry.getCarbonAmount(),
                entry.getDate()
        );
    }
}
