package com.bca.carbonfootprint.service;

import java.util.Optional;

import com.bca.carbonfootprint.dto.RegisterRequest;
import com.bca.carbonfootprint.model.User;

public interface UserService {

    void registerUser(RegisterRequest request);

    Optional<User> findByEmail(String email);

    void save(User user);
}