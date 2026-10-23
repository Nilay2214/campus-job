package com.placement.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Email delivery abstraction.
 *
 * <p>Supports sending password reset and notification emails.
 * Real SMTP sending is enabled when {@code MAIL_HOST} is configured or {@code spring.mail.host} is provided.
 * When SMTP is unconfigured or disabled, safe fallback logging is performed without logging secrets.</p>
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final boolean emailEnabled;
    private final String fromEmail;

    public EmailService(
            @Value("${spring.mail.host:}") String mailHost,
            @Value("${spring.mail.username:}") String mailUsername,
            @Value("${spring.mail.from:noreply@campusjob.com}") String fromEmail,
            @Value("${app.mail.enabled:true}") boolean mailEnabledFlag,
            JavaMailSender mailSender) {
        this.mailSender = mailSender;
        this.fromEmail = (fromEmail == null || fromEmail.isBlank()) ? "noreply@campusjob.com" : fromEmail;
        
        // Real SMTP is enabled if mailEnabledFlag is true AND a host is provided AND (if not localhost) a username is provided
        boolean isLocalHost = mailHost != null && (mailHost.contains("localhost") || mailHost.contains("127.0.0.1") || mailHost.contains("mailpit") || mailHost.contains("mailhog"));
        boolean hasCredentials = mailUsername != null && !mailUsername.isBlank();
        this.emailEnabled = mailEnabledFlag && mailHost != null && !mailHost.isBlank() && (hasCredentials || isLocalHost);

        if (!this.emailEnabled) {
            log.warn("Email delivery is in SIMULATION mode (SMTP unconfigured or app.mail.enabled=false). Real emails will not be dispatched to user inboxes.");
        } else {
            log.info("Email delivery is ENABLED via SMTP host: {}", mailHost);
        }
    }

    /**
     * Send a professional Campus Job password reset email.
     *
     * @param to recipient email
     * @param resetLink complete reset URL
     * @param expirationMinutes TTL in minutes
     */
    public void sendPasswordResetEmail(String to, String resetLink, int expirationMinutes) {
        String subject = "Campus Job — Password Reset Request";
        String body = "Hello,\n\n"
                + "We received a request to reset your Campus Job password.\n\n"
                + "You can reset your password by clicking the link below or pasting it into your browser:\n"
                + resetLink + "\n\n"
                + "This link expires in " + expirationMinutes + " minutes and can only be used once.\n\n"
                + "If you did not request this password reset, you can safely ignore this email.\n\n"
                + "Regards,\n"
                + "Campus Job Team\n";

        if (!emailEnabled || mailSender == null) {
            log.info("[DEVELOPMENT SIMULATION] Password reset email simulated for {}. Reset link: {}", to, resetLink);
            return;
        }

        sendPlainText(to, subject, body);
    }

    /**
     * Send a plain-text email.
     *
     * @param to recipient
     * @param subject subject line
     * @param body body text
     */
    public void sendPlainText(String to, String subject, String body) {
        if (!emailEnabled || mailSender == null) {
            log.info("[DEVELOPMENT SIMULATION] Email delivery simulated; would have sent '{}' to {}", subject, to);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Successfully sent email with subject '{}' to {}", subject, to);
        } catch (MailException ex) {
            log.error("Failed to send email with subject '{}' to {}: {}", subject, to, ex.getMessage());
        }
    }

    public boolean isEmailEnabled() {
        return emailEnabled;
    }
}
