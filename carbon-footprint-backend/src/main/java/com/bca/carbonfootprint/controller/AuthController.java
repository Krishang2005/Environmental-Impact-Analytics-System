package com.bca.carbonfootprint.controller;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bca.carbonfootprint.dto.ChangePasswordRequest;
import com.bca.carbonfootprint.dto.LoginRequest;
import com.bca.carbonfootprint.dto.OtpRequest;
import com.bca.carbonfootprint.dto.RegisterRequest;
import com.bca.carbonfootprint.dto.ResetPasswordRequest;
import com.bca.carbonfootprint.model.PasswordResetToken;
import com.bca.carbonfootprint.model.User;
import com.bca.carbonfootprint.repository.PasswordResetTokenRepository;
import com.bca.carbonfootprint.security.CustomUserDetailsService;
import com.bca.carbonfootprint.security.JwtUtil;
import com.bca.carbonfootprint.security.OtpService;
import com.bca.carbonfootprint.service.EmailService;
import com.bca.carbonfootprint.service.UserService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int FAILED_WINDOW_MINUTES = 15;
    private static final Map<String, FailedLoginState> FAILED_LOGIN_STATE = new ConcurrentHashMap<>();

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Value("${app.auth.cookie-secure:false}")
    private boolean authCookieSecure;

    @Value("${app.auth.cookie-same-site:Lax}")
    private String authCookieSameSite;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {

        Optional<User> existingUser = userService.findByEmail(request.getEmail());

        if (existingUser.isPresent()) {
            return ResponseEntity.badRequest().body("Email already registered");
        }

        userService.registerUser(request);

        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        if (isRateLimited(request.getEmail())) {
            return ResponseEntity.status(429).body("Too many failed login attempts. Try again in 15 minutes.");
        }

        Optional<User> optionalUser = userService.findByEmail(request.getEmail());

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        User user = optionalUser.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            registerFailedAttempt(request.getEmail());
            if (user.getRole() != null && "ROLE_ADMIN".equalsIgnoreCase(user.getRole().getName())) {
                try {
                    emailService.sendLoginAttemptAlert(user.getEmail());
                } catch (Exception ignored) {
                    // Do not block login flow if alert email fails.
                }
            }
            return ResponseEntity.badRequest().body("Invalid password");
        }

        clearFailedAttempts(request.getEmail());

        if (request.getLatitude() != null && request.getLongitude() != null) {
            user.setLatitude(request.getLatitude());
            user.setLongitude(request.getLongitude());
            userService.save(user);
        }

        if (user.getRole() != null &&
                "ROLE_ADMIN".equalsIgnoreCase(user.getRole().getName())) {

            try {
                otpService.generateOtp(user.getEmail());
            } catch (RuntimeException ex) {
                return ResponseEntity.status(503).body(ex.getMessage());
            }
            return ResponseEntity.ok("OTP sent to your email. Please verify OTP.");
        }

        UserDetails userDetails =
                customUserDetailsService.loadUserByUsername(user.getEmail());

        String token = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildAccessTokenCookie(token).toString())
                .body(buildAuthResponse(user, token));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpRequest request) {

        boolean isValid = otpService.validateOtp(
                request.getEmail(),
                request.getOtp()
        );

        if (!isValid) {
            return ResponseEntity.badRequest().body("Invalid or Expired OTP");
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

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        ResponseCookie clearCookie = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(authCookieSecure)
                .sameSite(authCookieSameSite)
                .path("/")
                .maxAge(Duration.ZERO)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body("Logged out successfully");
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

    private boolean isRateLimited(String email) {
        FailedLoginState state = FAILED_LOGIN_STATE.get(email.toLowerCase());
        if (state == null) {
            return false;
        }
        if (state.windowStart.plusMinutes(FAILED_WINDOW_MINUTES).isBefore(LocalDateTime.now())) {
            FAILED_LOGIN_STATE.remove(email.toLowerCase());
            return false;
        }
        return state.attemptCount >= MAX_FAILED_ATTEMPTS;
    }

    private void registerFailedAttempt(String email) {
        String key = email.toLowerCase();
        FailedLoginState state = FAILED_LOGIN_STATE.get(key);
        LocalDateTime now = LocalDateTime.now();
        if (state == null || state.windowStart.plusMinutes(FAILED_WINDOW_MINUTES).isBefore(now)) {
            FAILED_LOGIN_STATE.put(key, new FailedLoginState(now, 1));
            return;
        }

        state.attemptCount += 1;
    }

    private void clearFailedAttempts(String email) {
        FAILED_LOGIN_STATE.remove(email.toLowerCase());
    }

    private static class FailedLoginState {
        private final LocalDateTime windowStart;
        private int attemptCount;

        private FailedLoginState(LocalDateTime windowStart, int attemptCount) {
            this.windowStart = windowStart;
            this.attemptCount = attemptCount;
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {

        Optional<User> optionalUser = userService.findByEmail(email);

        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            String resetToken = UUID.randomUUID().toString();

            passwordResetTokenRepository.findByUser(user)
                    .ifPresent(passwordResetTokenRepository::delete);

            PasswordResetToken passwordResetToken = new PasswordResetToken(
                    resetToken,
                    LocalDateTime.now().plusMinutes(15),
                    user
            );

            passwordResetTokenRepository.save(passwordResetToken);
            emailService.sendResetPasswordEmail(user.getEmail(), resetToken);
        }

        return ResponseEntity.ok("If the account exists, a password reset link has been sent");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {

        if (request.getToken() == null || request.getToken().isBlank()) {
            return ResponseEntity.badRequest().body("Reset token is required");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            return ResponseEntity.badRequest().body("New password must be at least 6 characters");
        }

        Optional<PasswordResetToken> optionalToken =
                passwordResetTokenRepository.findByToken(request.getToken());

        if (optionalToken.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid reset link");
        }

        PasswordResetToken passwordResetToken = optionalToken.get();

        if (passwordResetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(passwordResetToken);
            return ResponseEntity.badRequest().body("Reset link has expired");
        }

        User user = passwordResetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userService.save(user);
        passwordResetTokenRepository.delete(passwordResetToken);

        return ResponseEntity.ok("Password reset successfully");
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        Optional<User> optionalUser = userService.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        User user = optionalUser.get();

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Old password incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userService.save(user);

        return ResponseEntity.ok("Password changed successfully");
    }
}
