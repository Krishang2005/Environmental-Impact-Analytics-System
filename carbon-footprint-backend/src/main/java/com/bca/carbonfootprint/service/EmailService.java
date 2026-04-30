package com.bca.carbonfootprint.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.frontend.reset-password-url:http://localhost:5173/reset-password}")
    private String resetPasswordUrl;

    // ================= OTP EMAIL =================
    public void sendOtpEmail(String toEmail, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Admin Login OTP - Carbon Footprint System");
        message.setText(
                "Dear Admin,\n\n" +
                "Your One-Time Password (OTP) is: " + otp + "\n\n" +
                "This OTP is valid for 5 minutes.\n\n" +
                "If you did not request this login, please ignore this email.\n\n" +
                "Regards,\nCarbon Footprint Team"
        );

        mailSender.send(message);
        System.out.println("OTP email sent to: " + toEmail);
    }

    // ================= FAILED LOGIN ALERT =================
    public void sendLoginAttemptAlert(String toEmail) {

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Login Attempt Alert - Carbon Footprint System");
        message.setText(
                "Dear Admin,\n\n" +
                "Someone attempted to log in to your account with an incorrect password.\n\n" +
                "If this was not you, please reset your password immediately.\n\n" +
                "Regards,\nCarbon Footprint Team"
        );

        mailSender.send(message);
    }

    // ================= PASSWORD RESET =================
    public void sendResetPasswordEmail(String toEmail, String token) {
        String resetLink = resetPasswordUrl + "?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Password Reset - Carbon Footprint System");
        message.setText(
                "Dear User,\n\n" +
                "We received a request to reset your password.\n\n" +
                "If this was you, use the link below to set a new password:\n" +
                resetLink + "\n\n" +
                "This link is valid for 15 minutes and can only be used once.\n\n" +
                "If you did not request this, you can safely ignore this email.\n\n" +
                "Regards,\nCarbon Footprint Team"
        );

        mailSender.send(message);
    }

    public void sendEmissionAlertEmail(String toEmail, String subject, String messageBody) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(messageBody);
        mailSender.send(message);
    }

    public void sendGoalSummaryEmail(String toEmail, String subject, String messageBody) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(messageBody);
        mailSender.send(message);
    }
}
