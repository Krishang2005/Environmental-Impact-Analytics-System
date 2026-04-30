package com.bca.carbonfootprint.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.bca.carbonfootprint.model.EmissionRecord;

public interface EmissionRecordRepository 
        extends JpaRepository<EmissionRecord, Long> {
}