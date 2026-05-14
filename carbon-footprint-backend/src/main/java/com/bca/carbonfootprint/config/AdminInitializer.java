package com.bca.carbonfootprint.config;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.bca.carbonfootprint.model.Role;
import com.bca.carbonfootprint.model.SectorCategory;
import com.bca.carbonfootprint.model.SectorType;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.repository.RoleRepository;
import com.bca.carbonfootprint.repository.UserRepository;

@Configuration
public class AdminInitializer {

    @Value("${app.admin.default-email:krishangcg0@gmail.com}")
    private String defaultAdminEmail;

    @Value("${app.admin.default-password:krish2005}")
    private String defaultAdminPassword;

    @Bean
    CommandLineRunner initDefaultAdmin(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseGet(() -> roleRepository.save(new Role("ROLE_ADMIN")));

            Optional<User> existingAdmin = userRepository.findByEmail(defaultAdminEmail);
            User admin = existingAdmin.orElseGet(User::new);
            boolean isNewAdmin = existingAdmin.isEmpty();

            admin.setName("Admin");
            admin.setEmail(defaultAdminEmail);
            admin.setRole(adminRole);

            if (isNewAdmin) {
                admin.setPassword(passwordEncoder.encode(defaultAdminPassword));
            }

            if (admin.getSectorCategory() == null) {
                admin.setSectorCategory(SectorCategory.COMMERCIAL);
            }

            if (admin.getSectorType() == null) {
                admin.setSectorType(SectorType.OFFICE);
            }

            userRepository.save(admin);
        };
    }   
}
