package com.bca.carbonfootprint.controller;

import com.bca.carbonfootprint.model.EmissionRecord;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.repository.EmissionRecordRepository;
import com.bca.carbonfootprint.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/emissions")
public class EmissionController {

    @Autowired
    private EmissionRecordRepository emissionRepository;

    @Autowired
    private UserRepository userRepository;

    // ===============================
    // 1️⃣ USER ADDS EMISSION
    // ===============================
    @PostMapping("/add")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> addEmission(
            @RequestBody EmissionRecord record,
            Principal principal) {

        // Get logged-in user
        User user = userRepository
                .findByEmail(principal.getName())
                .orElseThrow(() -> 
                        new RuntimeException("User not found"));

        // Set user and date
        record.setUser(user);
        record.setDate(LocalDate.now());

        // Save to database
        emissionRepository.save(record);

        return ResponseEntity.ok("Emission recorded successfully");
    }

    // ===============================
    // 2️⃣ USER VIEWS OWN EMISSIONS
    // ===============================
    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<EmissionRecord>> getMyEmissions(
            Principal principal) {

        User user = userRepository
                .findByEmail(principal.getName())
                .orElseThrow(() -> 
                        new RuntimeException("User not found"));

        List<EmissionRecord> myRecords =
                emissionRepository.findAll()
                        .stream()
                        .filter(e -> e.getUser() != null &&
                                e.getUser().getId().equals(user.getId()))
                        .toList();

        return ResponseEntity.ok(myRecords);
    }
}