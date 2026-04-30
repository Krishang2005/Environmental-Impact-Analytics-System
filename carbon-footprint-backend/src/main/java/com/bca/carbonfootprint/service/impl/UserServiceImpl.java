package com.bca.carbonfootprint.service.impl;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.bca.carbonfootprint.dto.RegisterRequest;
import com.bca.carbonfootprint.model.Role;
import com.bca.carbonfootprint.model.SectorCategory;
import com.bca.carbonfootprint.model.SectorType;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.model.Zone;
import com.bca.carbonfootprint.repository.RoleRepository;
import com.bca.carbonfootprint.repository.UserRepository;
import com.bca.carbonfootprint.repository.ZoneRepository;
import com.bca.carbonfootprint.service.UserService;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ZoneRepository zoneRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void registerUser(RegisterRequest request) {

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());

        // 🔥 IMPORTANT — ENCODE PASSWORD
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        user.setAddress(request.getAddress());
        user.setLatitude(request.getLatitude());
        user.setLongitude(request.getLongitude());

        // Default Role = USER
        Role role = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Role not found"));

        user.setRole(role);

        // Sector Enums
        user.setSectorCategory(
                SectorCategory.valueOf(request.getSectorCategory())
        );

        user.setSectorType(
                SectorType.valueOf(request.getSectorType())
        );

        // Optional zone assignment if needed
        if (request.getLatitude() != null &&
            request.getLongitude() != null) {

            // Simple zone detection example
            for (Zone zone : zoneRepository.findAll()) {

                if (request.getLatitude() >= zone.getMinLatitude() &&
                    request.getLatitude() <= zone.getMaxLatitude() &&
                    request.getLongitude() >= zone.getMinLongitude() &&
                    request.getLongitude() <= zone.getMaxLongitude()) {

                    user.setZone(zone);
                    break;
                }
            }
        }

        userRepository.save(user);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public void save(User user) {
        userRepository.save(user);
    }
}