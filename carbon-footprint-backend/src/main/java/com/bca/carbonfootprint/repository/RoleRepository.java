package com.bca.carbonfootprint.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.bca.carbonfootprint.model.Role;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
}