package com.bca.carbonfootprint.controller;

import java.time.Duration;
import java.util.HashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.bca.carbonfootprint.dto.OtpRequest;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.security.JwtUtil;
import com.bca.carbonfootprint.security.OtpService;
import com.bca.carbonfootprint.security.CustomUserDetailsService;
import com.bca.carbonfootprint.service.UserService;

@RestController
@RequestMapping("/api/admin-auth")
public class AdminAuthController {

    @Autowired
    private OtpService otpService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private UserService userService;

    @Value("${app.auth.cookie-secure:false}")
    private boolean authCookieSecure;

    @Value("${app.auth.cookie-same-site:Lax}")
    private String authCookieSameSite;

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpRequest request) {

        boolean isValid = otpService.validateOtp(
                request.getEmail(),
                request.getOtp()
        );

        if (!isValid) {
            return ResponseEntity.badRequest().body("Invalid OTP");
        }

        otpService.clearOtp(request.getEmail());

        UserDetails userDetails =
                customUserDetailsService.loadUserByUsername(request.getEmail());

        String token = jwtUtil.generateToken(userDetails);
        User user = userService.findByEmail(request.getEmail()).orElseThrow();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildAccessTokenCookie(token).toString())
                .body(buildAuthResponse(user, token));
    }

    private ResponseCookie buildAccessTokenCookie(String token) {
        return ResponseCookie.from("access_token", token)
                .httpOnly(true)
                .secure(authCookieSecure)
                .sameSite(authCookieSameSite)
                .path("/")
                .maxAge(Duration.ofHours(10))
                .build();
    }

    private Map<String, String> buildAuthResponse(User user, String token) {
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("role", user.getRole() != null ? user.getRole().getName() : "");
        response.put("name", user.getName() != null ? user.getName() : "");
        response.put("email", user.getEmail() != null ? user.getEmail() : "");
        response.put(
                "sectorCategory",
                user.getSectorCategory() != null ? user.getSectorCategory().name() : ""
        );
        response.put(
                "sectorType",
                user.getSectorType() != null ? user.getSectorType().name() : ""
        );
        return response;
    }
}
