package com.bca.carbonfootprint.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bca.carbonfootprint.model.QuickEntryTemplate;

public interface QuickEntryTemplateRepository extends JpaRepository<QuickEntryTemplate, Long> {

    List<QuickEntryTemplate> findByUser_IdOrderByUseCountDescCreatedAtDesc(Long userId);

    Optional<QuickEntryTemplate> findByIdAndUser_Id(Long id, Long userId);

    boolean existsByUser_IdAndNameIgnoreCase(Long userId, String name);
}
