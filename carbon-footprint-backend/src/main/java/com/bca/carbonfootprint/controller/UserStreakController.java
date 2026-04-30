package com.bca.carbonfootprint.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bca.carbonfootprint.dto.StreakOverviewResponse;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.repository.UserRepository;
import com.bca.carbonfootprint.service.StreakService;

@RestController
@RequestMapping("/api/user/streak")
public class UserStreakController {

    private final StreakService streakService;
    private final UserRepository userRepository;

    public UserStreakController(StreakService streakService, UserRepository userRepository) {
        this.streakService = streakService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public StreakOverviewResponse getOverview(Authentication authentication) {
        return streakService.getOverview(getLoggedUser(authentication));
    }

    @PostMapping("/check-in")
    public StreakOverviewResponse checkIn(Authentication authentication) {
        return streakService.checkIn(getLoggedUser(authentication));
    }

    @PostMapping("/claim-weekly-box")
    public StreakOverviewResponse claimWeeklyBox(Authentication authentication) {
        return streakService.claimWeeklyReward(getLoggedUser(authentication));
    }

    private User getLoggedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
