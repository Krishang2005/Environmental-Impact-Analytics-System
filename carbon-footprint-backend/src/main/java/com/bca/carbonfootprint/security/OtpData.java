package com.bca.carbonfootprint.security;

import java.time.LocalDateTime;

public class OtpData {

    private String otp;
    private LocalDateTime expiryTime;

    public OtpData(String otp, LocalDateTime expiryTime) {
        this.otp = otp;
        this.expiryTime = expiryTime;
    }

    public String getOtp() {
        return otp;
    }

    public LocalDateTime getExpiryTime() {
        return expiryTime;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryTime);
    }
}