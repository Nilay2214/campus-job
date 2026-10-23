package com.placement.service;

import com.placement.config.JwtUtil;
import com.placement.dto.AuthResponse;
import com.placement.dto.LoginRequest;
import com.placement.dto.RegisterRequest;
import com.placement.entity.MobileOtpToken;
import com.placement.entity.PasswordResetToken;
import com.placement.entity.User;
import com.placement.repository.MobileOtpTokenRepository;
import com.placement.repository.PasswordResetTokenRepository;
import com.placement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final LoginAttemptService loginAttemptService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final MobileOtpTokenRepository mobileOtpTokenRepository;
    private final SmsService smsService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${app.password-reset.token-ttl-minutes:30}")
    private int tokenTtlMinutes = 30;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl = "http://localhost:3000";

    @Value("${app.otp.ttl-minutes:5}")
    private int otpTtlMinutes = 5;

    @Value("${app.otp.cooldown-seconds:60}")
    private int otpCooldownSeconds = 60;

    @Value("${app.otp.max-attempts:3}")
    private int otpMaxAttempts = 3;

    @Value("${app.otp.max-requests-per-hour:5}")
    private int otpMaxRequestsPerHour = 5;

    public AuthResponse register(RegisterRequest request) {
        // Simple in-memory rate limit against mass account creation (single-instance protection).
        String emailNormalized = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        if (!loginAttemptService.isRegistrationAllowed(emailNormalized)) {
            throw new IllegalStateException("Too many registrations. Please try again later.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Prevent privilege escalation: a user must never self-assign the ADMIN role.
        String requestedRole = request.getRole() == null ? "STUDENT" : request.getRole().trim().toUpperCase();
        if (requestedRole.isBlank() || requestedRole.equals("ADMIN")) {
            requestedRole = "STUDENT";
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.valueOf(requestedRole))
                .enabled(true)
                .build();

        userRepository.save(user);
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .build();

        String token = jwtUtil.generateToken(userDetails);
        return AuthResponse.builder().token(token).role(user.getRole().name()).message("Registration successful").build();
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim();

        // Reject login attempts for a locked account BEFORE hitting the database/auth manager.
        if (loginAttemptService.isLocked(email)) {
            throw new LockedException("Account temporarily locked due to too many failed attempts");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );

            // Successful authentication resets any prior failed attempts.
            loginAttemptService.onSuccessfulLogin(email);

            User user = userRepository.findByEmail(email).orElseThrow();
            UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                    .username(user.getEmail())
                    .password(user.getPassword())
                    .roles(user.getRole().name())
                    .build();

            String token = jwtUtil.generateToken(userDetails);
            return AuthResponse.builder().token(token).role(user.getRole().name()).message("Login successful").build();
        } catch (AuthenticationException ex) {
            loginAttemptService.onFailedAttempt(email);
            throw ex;
        }
    }

    /**
     * Process Google OAuth / OIDC verified identity.
     */
    public AuthResponse processOAuthPostLogin(String email, String fullName, String providerId, String provider) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required for OAuth login");
        }
        String normalizedEmail = email.trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail).orElse(null);

        if (user != null) {
            // Existing user
            if (!user.isEnabled()) {
                throw new DisabledException("Account is disabled. Please contact administrator.");
            }
            // Preserve existing role (STUDENT, RECRUITER, ADMIN). Never overwrite.
            if ((user.getFullName() == null || user.getFullName().isBlank()) && fullName != null && !fullName.isBlank()) {
                user.setFullName(fullName.trim());
                userRepository.save(user);
            }
        } else {
            // New user: default to STUDENT, never ADMIN
            user = User.builder()
                    .email(normalizedEmail)
                    .fullName((fullName != null && !fullName.isBlank()) ? fullName.trim() : "Google User")
                    .password(passwordEncoder.encode(generateSecureToken()))
                    .role(User.Role.STUDENT)
                    .enabled(true)
                    .build();
            userRepository.save(user);
        }

        String userPassword = (user.getPassword() != null && !user.getPassword().isBlank()) ? user.getPassword() : "N/A";
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(userPassword)
                .disabled(!user.isEnabled())
                .roles(user.getRole().name())
                .build();

        String token = jwtUtil.generateToken(userDetails);
        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .message("Google authentication successful")
                .build();
    }

    /**
     * Request a one-time password (OTP) for mobile number authentication.
     */
    public String requestMobileOtp(String rawPhoneNumber) {
        String normalized = normalizePhoneNumber(rawPhoneNumber);

        // 1. Rate limiting per phone (e.g. max 5 per hour)
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long requestsInLastHour = mobileOtpTokenRepository.countByPhoneNumberAndCreatedAtAfter(normalized, oneHourAgo);
        if (requestsInLastHour >= otpMaxRequestsPerHour) {
            throw new IllegalStateException("Too many OTP requests for this phone number. Please try again later.");
        }

        // 2. Cooldown check (e.g. must wait 60 seconds between resends)
        mobileOtpTokenRepository.findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc(normalized).ifPresent(lastToken -> {
            LocalDateTime cooldownEnd = lastToken.getCreatedAt().plusSeconds(otpCooldownSeconds);
            if (cooldownEnd.isAfter(LocalDateTime.now())) {
                long secondsLeft = Duration.between(LocalDateTime.now(), cooldownEnd).toSeconds() + 1;
                throw new IllegalStateException("Please wait " + secondsLeft + " seconds before requesting another OTP.");
            }
            // Invalidate older unused token
            lastToken.setUsed(true);
            mobileOtpTokenRepository.save(lastToken);
        });

        // 3. Generate 6-digit secure random numeric OTP
        int numericOtp = 100000 + SECURE_RANDOM.nextInt(900000);
        String otpString = String.valueOf(numericOtp);

        // 4. Save hashed token
        MobileOtpToken token = MobileOtpToken.builder()
                .phoneNumber(normalized)
                .otpHash(sha256(otpString))
                .expiry(LocalDateTime.now().plusMinutes(otpTtlMinutes))
                .attempts(0)
                .used(false)
                .build();
        mobileOtpTokenRepository.save(token);

        // 5. Send via configured SMS service
        smsService.sendOtp(normalized, "Your Campus Job verification code is " + otpString + ". Valid for " + otpTtlMinutes + " minutes.");

        return "OTP has been sent to your mobile number.";
    }

    /**
     * Verify mobile OTP and issue Campus Job JWT.
     */
    public AuthResponse verifyMobileOtp(String rawPhoneNumber, String rawOtp) {
        if (rawOtp == null || rawOtp.isBlank()) {
            throw new BadCredentialsException("OTP is required");
        }
        String normalized = normalizePhoneNumber(rawPhoneNumber);

        MobileOtpToken token = mobileOtpTokenRepository.findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc(normalized)
                .orElseThrow(() -> new BadCredentialsException("No active OTP request found. Please request a new OTP."));

        if (token.getExpiry() == null || token.getExpiry().isBefore(LocalDateTime.now())) {
            token.setUsed(true);
            mobileOtpTokenRepository.save(token);
            throw new BadCredentialsException("OTP has expired. Please request a new one.");
        }

        if (token.getAttempts() >= otpMaxAttempts) {
            token.setUsed(true);
            mobileOtpTokenRepository.save(token);
            throw new BadCredentialsException("Too many invalid attempts. This OTP is no longer valid. Please request a new one.");
        }

        String inputHash = sha256(rawOtp.trim());
        if (!inputHash.equals(token.getOtpHash())) {
            token.setAttempts(token.getAttempts() + 1);
            if (token.getAttempts() >= otpMaxAttempts) {
                token.setUsed(true);
            }
            mobileOtpTokenRepository.save(token);

            int remaining = otpMaxAttempts - token.getAttempts();
            if (remaining > 0) {
                throw new BadCredentialsException("Invalid OTP code. " + remaining + " attempt(s) remaining.");
            } else {
                throw new BadCredentialsException("Too many invalid attempts. This OTP is no longer valid. Please request a new one.");
            }
        }

        // OTP is valid - mark used immediately
        token.setUsed(true);
        mobileOtpTokenRepository.save(token);

        // Resolve or create user
        User user = userRepository.findByPhoneNumber(normalized).orElse(null);

        if (user != null) {
            // Existing user
            if (!user.isEnabled()) {
                throw new DisabledException("Account is disabled. Please contact administrator.");
            }
            user.setPhoneVerified(true);
            userRepository.save(user);
        } else {
            // New user via Mobile OTP: default role is STUDENT, never ADMIN
            String syntheticEmail = "phone_" + normalized.replaceAll("[^0-9]", "") + "@phone.campusjob.local";
            // Check if synthetic email exists (in unlikely case)
            if (userRepository.existsByEmail(syntheticEmail)) {
                syntheticEmail = "phone_" + normalized.replaceAll("[^0-9]", "") + "_" + System.nanoTime() + "@phone.campusjob.local";
            }

            user = User.builder()
                    .phoneNumber(normalized)
                    .phoneVerified(true)
                    .email(syntheticEmail)
                    .fullName("Mobile User")
                    .password(passwordEncoder.encode(generateSecureToken()))
                    .role(User.Role.STUDENT)
                    .enabled(true)
                    .build();
            userRepository.save(user);
        }

        String userPassword = (user.getPassword() != null && !user.getPassword().isBlank()) ? user.getPassword() : "N/A";
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(userPassword)
                .disabled(!user.isEnabled())
                .roles(user.getRole().name())
                .build();

        String jwt = jwtUtil.generateToken(userDetails);
        return AuthResponse.builder()
                .token(jwt)
                .role(user.getRole().name())
                .message("Mobile authentication successful")
                .build();
    }

    /**
     * Request a password reset for the given email.
     */
    public String requestPasswordReset(String emailAddress) {
        String email = emailAddress == null ? "" : emailAddress.trim().toLowerCase();
        if (email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        userRepository.findByEmail(email).ifPresent(user -> {
            String rawToken = generateSecureToken();
            PasswordResetToken token = PasswordResetToken.builder()
                    .tokenHash(sha256(rawToken))
                    .user(user)
                    .expiry(LocalDateTime.now().plusMinutes(tokenTtlMinutes))
                    .used(false)
                    .build();
            passwordResetTokenRepository.save(token);

            String base = (frontendUrl == null || frontendUrl.isBlank()) ? "http://localhost:3000" : frontendUrl.replaceAll("/+$", "");
            String resetLink = base + "/reset-password?token=" + rawToken;

            emailService.sendPasswordResetEmail(user.getEmail(), resetLink, tokenTtlMinutes);
        });

        return "If that email address is registered, a password reset link has been sent.";
    }

    /**
     * Apply a new password using a previously issued reset token.
     */
    public String resetPassword(String token, String newRawPassword) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token is required");
        }
        if (newRawPassword == null || newRawPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(sha256(token))
                .filter(t -> !t.isUsed())
                .filter(t -> t.getExpiry() != null && t.getExpiry().isAfter(LocalDateTime.now()))
                .orElse(null);

        if (resetToken == null) {
            throw new IllegalArgumentException("Invalid or expired reset token");
        }

        User user = resetToken.getUser();
        if (user == null) {
            throw new IllegalArgumentException("Invalid reset token");
        }

        user.setPassword(passwordEncoder.encode(newRawPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        return "Password reset successful. You can now log in with your new password.";
    }

    public String normalizePhoneNumber(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Phone number is required");
        }
        String cleaned = raw.replaceAll("[\\s\\-\\(\\)]", "").trim();
        if (!cleaned.startsWith("+")) {
            // Default to India (+91) if 10 digits
            if (cleaned.matches("^\\d{10}$")) {
                cleaned = "+91" + cleaned;
            } else {
                cleaned = "+" + cleaned;
            }
        }
        if (!cleaned.matches("^\\+[1-9]\\d{7,14}$")) {
            throw new IllegalArgumentException("Invalid phone number format. Must be E.164 (e.g. +919876543210)");
        }
        return cleaned;
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        StringBuilder sb = new StringBuilder(64);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(64);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }
}
