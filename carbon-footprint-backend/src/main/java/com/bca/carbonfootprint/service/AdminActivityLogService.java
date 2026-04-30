package com.bca.carbonfootprint.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bca.carbonfootprint.model.AdminActivityLog;
import com.bca.carbonfootprint.repository.AdminActivityLogRepository;

@Service
public class AdminActivityLogService {

    @Autowired
    private AdminActivityLogRepository adminActivityLogRepository;

    public void log(String actorEmail, String actionType, String description) {
        AdminActivityLog entry = new AdminActivityLog();
        entry.setActorEmail(actorEmail == null || actorEmail.isBlank() ? "admin@system" : actorEmail);
        entry.setActionType(actionType == null || actionType.isBlank() ? "GENERAL" : actionType);
        entry.setDescription(description == null || description.isBlank() ? "Admin action recorded" : description);
        entry.setCreatedAt(LocalDateTime.now());
        adminActivityLogRepository.save(entry);
    }
}
