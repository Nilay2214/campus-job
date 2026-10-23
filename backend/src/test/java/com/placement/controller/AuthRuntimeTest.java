package com.placement.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.placement.dto.LoginRequest;
import com.placement.dto.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SECONDARY RUNTIME VERIFICATION (H2 in-memory, NOT MySQL).
 *
 * <p>This test boots the full Spring application context against the H2 test database
 * (see src/test/resources/application.properties) and exercises the real auth endpoints
 * end-to-end: register -> login -> protected-route JWT. It is a substitute for a live
 * MySQL runtime check, which is BLOCKED because DB_PASSWORD is not configured locally.</p>
 *
 * <p>This is clearly labeled as H2 verification only. It does NOT claim MySQL parity.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthRuntimeTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.placement.repository.UserRepository userRepository;

    @Autowired
    private com.placement.repository.MobileOtpTokenRepository mobileOtpTokenRepository;

    @org.springframework.boot.test.mock.mockito.MockBean
    private com.placement.service.FirebaseTokenVerifier firebaseTokenVerifier;

    private String uniqueEmail(String prefix) {
        return prefix + System.nanoTime() + "@example.com";
    }

    @Test
    @DisplayName("H2: register + login + protected route works end-to-end")
    void registerAndLoginEndToEnd() throws Exception {
String email = uniqueEmail("student");
        RegisterRequest register = new RegisterRequest();
        register.setFullName("Student User");
        register.setEmail(email);
        register.setPassword("Password@123");
        register.setRole("STUDENT");

        // 1. Register
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andReturn();

        JsonNode regJson = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String token = regJson.get("token").asText();

        // 2. Login with the token's user
        LoginRequest login = new LoginRequest();
        login.setEmail(email);
        login.setPassword("Password@123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        // 3. Protected route with the JWT must be authenticated (not 401).
        mockMvc.perform(post("/api/students/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("H2: ADMIN self-registration is blocked (role downgraded to STUDENT)")
    void adminSelfRegistrationBlocked() throws Exception {
RegisterRequest register = new RegisterRequest();
        register.setFullName("Trying Admin");
        register.setEmail(uniqueEmail("tryingadmin"));
        register.setPassword("Password@123");
        register.setRole("ADMIN");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isOk())
                // Privilege escalation guard forces STUDENT, never ADMIN.
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    @DisplayName("H2: protected endpoint rejects unauthenticated request with 401")
    void protectedEndpointRejectsAnonymous() throws Exception {
        mockMvc.perform(post("/api/students/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("H2: forgot-password returns generic message for both existing and non-existing email")
    void forgotPasswordUserEnumerationProtected() throws Exception {
        // 1. Existing email
        String email = uniqueEmail("existing");
        RegisterRequest register = new RegisterRequest();
        register.setFullName("Existing User");
        register.setEmail(email);
        register.setPassword("Password@123");
        register.setRole("STUDENT");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If that email address is registered, a password reset link has been sent."));

        // 2. Non-existing email returns identical response
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nonexistent_" + System.nanoTime() + "@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If that email address is registered, a password reset link has been sent."));
    }

    @Test
    @DisplayName("H2: reset-password rejects invalid token with 400")
    void resetPasswordWithInvalidTokenRejected() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"invalid-random-token-12345\",\"newPassword\":\"NewPassword@123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or expired reset token"));
    }

    @Test
    @DisplayName("H2: google login creates new user with STUDENT role")
    void googleLoginNewUser() throws Exception {
        String email = uniqueEmail("google_student");
        com.placement.dto.GoogleAuthRequest request = com.placement.dto.GoogleAuthRequest.builder()
                .email(email)
                .fullName("Google Student User")
                .googleId("google-sub-12345")
                .build();

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.message").value("Google authentication successful"));
    }

    @Test
    @DisplayName("H2: google login links existing recruiter account and preserves role")
    void googleLoginExistingRecruiter() throws Exception {
        String email = uniqueEmail("google_recruiter");
        RegisterRequest register = new RegisterRequest();
        register.setFullName("Existing Recruiter");
        register.setEmail(email);
        register.setPassword("Password@123");
        register.setRole("RECRUITER");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isOk());

        com.placement.dto.GoogleAuthRequest request = com.placement.dto.GoogleAuthRequest.builder()
                .email(email)
                .fullName("Existing Recruiter Updated")
                .googleId("google-sub-67890")
                .build();

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("RECRUITER"))
                .andExpect(jsonPath("$.message").value("Google authentication successful"));
    }

    @Test
    @DisplayName("H2: Firebase Google login creates new user with STUDENT role")
    void firebaseLoginNewUser() throws Exception {
        String email = uniqueEmail("firebase_student");
        org.mockito.Mockito.when(firebaseTokenVerifier.verifyToken("valid-student-firebase-token"))
                .thenReturn(new com.placement.service.FirebaseTokenVerifier.FirebaseUserData(
                        "firebase-uid-12345",
                        email,
                        "Firebase Student User",
                        true
                ));

        com.placement.dto.FirebaseLoginRequest request = new com.placement.dto.FirebaseLoginRequest("valid-student-firebase-token");

        mockMvc.perform(post("/api/auth/firebase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.message").value("Google authentication successful"));
    }

    @Test
    @DisplayName("H2: Firebase Google login links existing recruiter account and preserves role")
    void firebaseLoginExistingRecruiter() throws Exception {
        String email = uniqueEmail("firebase_recruiter");
        RegisterRequest register = new RegisterRequest();
        register.setFullName("Existing Recruiter");
        register.setEmail(email);
        register.setPassword("Password@123");
        register.setRole("RECRUITER");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isOk());

        org.mockito.Mockito.when(firebaseTokenVerifier.verifyToken("valid-recruiter-firebase-token"))
                .thenReturn(new com.placement.service.FirebaseTokenVerifier.FirebaseUserData(
                        "firebase-uid-67890",
                        email,
                        "Existing Recruiter",
                        true
                ));

        com.placement.dto.FirebaseLoginRequest request = new com.placement.dto.FirebaseLoginRequest("valid-recruiter-firebase-token");

        mockMvc.perform(post("/api/auth/firebase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("RECRUITER"))
                .andExpect(jsonPath("$.message").value("Google authentication successful"));
    }

    @Test
    @DisplayName("H2: Firebase Google login links existing admin account and preserves role")
    void firebaseLoginExistingAdmin() throws Exception {
        String email = uniqueEmail("firebase_admin");
        com.placement.entity.User admin = com.placement.entity.User.builder()
                .email(email)
                .fullName("Admin User")
                .password("encodedPassword")
                .role(com.placement.entity.User.Role.ADMIN)
                .enabled(true)
                .build();
        userRepository.save(admin);

        org.mockito.Mockito.when(firebaseTokenVerifier.verifyToken("valid-admin-firebase-token"))
                .thenReturn(new com.placement.service.FirebaseTokenVerifier.FirebaseUserData(
                        "firebase-uid-admin",
                        email,
                        "Admin User",
                        true
                ));

        com.placement.dto.FirebaseLoginRequest request = new com.placement.dto.FirebaseLoginRequest("valid-admin-firebase-token");

        mockMvc.perform(post("/api/auth/firebase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.message").value("Google authentication successful"));
    }

    @Test
    @DisplayName("H2: Firebase Google login rejects disabled user account with 401")
    void firebaseLoginDisabledUser() throws Exception {
        String email = uniqueEmail("firebase_disabled");
        com.placement.entity.User disabledUser = com.placement.entity.User.builder()
                .email(email)
                .fullName("Disabled User")
                .password("encodedPassword")
                .role(com.placement.entity.User.Role.STUDENT)
                .enabled(false)
                .build();
        userRepository.save(disabledUser);

        org.mockito.Mockito.when(firebaseTokenVerifier.verifyToken("valid-disabled-firebase-token"))
                .thenReturn(new com.placement.service.FirebaseTokenVerifier.FirebaseUserData(
                        "firebase-uid-disabled",
                        email,
                        "Disabled User",
                        true
                ));

        com.placement.dto.FirebaseLoginRequest request = new com.placement.dto.FirebaseLoginRequest("valid-disabled-firebase-token");

        mockMvc.perform(post("/api/auth/firebase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Account is disabled. Please contact administrator."));
    }

    @Test
    @DisplayName("H2: Firebase Google login rejects invalid/expired token with 401")
    void firebaseLoginInvalidToken() throws Exception {
        org.mockito.Mockito.when(firebaseTokenVerifier.verifyToken("invalid-expired-firebase-token"))
                .thenThrow(new org.springframework.security.authentication.BadCredentialsException("Invalid or expired Firebase ID token"));

        com.placement.dto.FirebaseLoginRequest request = new com.placement.dto.FirebaseLoginRequest("invalid-expired-firebase-token");

        mockMvc.perform(post("/api/auth/firebase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("H2: Mobile OTP request and verification creates STUDENT user")
    void mobileOtpEndToEndNewUser() throws Exception {
        String phone = "+91987" + (System.currentTimeMillis() % 10000000);
        com.placement.dto.MobileOtpRequest request = new com.placement.dto.MobileOtpRequest(phone);

        // 1. Request OTP
        mockMvc.perform(post("/api/auth/mobile/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP has been sent to your mobile number."));

        // 2. Set known OTP hash
        java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest("123456".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) sb.append(String.format("%02x", b));

        com.placement.entity.MobileOtpToken token = mobileOtpTokenRepository
                .findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc(phone).orElseThrow();
        token.setOtpHash(sb.toString());
        mobileOtpTokenRepository.save(token);

        // 3. Verify OTP
        com.placement.dto.MobileOtpVerifyRequest verifyReq = new com.placement.dto.MobileOtpVerifyRequest(phone, "123456");

        mockMvc.perform(post("/api/auth/mobile/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.message").value("Mobile authentication successful"));
    }

    @Test
    @DisplayName("H2: Mobile OTP preserves RECRUITER role for existing user")
    void mobileOtpPreservesRecruiterRole() throws Exception {
        String phone = "+91911" + (System.currentTimeMillis() % 10000000);
        String email = uniqueEmail("recruiter_phone");
        com.placement.entity.User recruiter = com.placement.entity.User.builder()
                .email(email)
                .phoneNumber(phone)
                .fullName("Phone Recruiter")
                .password("encodedPassword")
                .role(com.placement.entity.User.Role.RECRUITER)
                .enabled(true)
                .build();
        userRepository.save(recruiter);

        // Request OTP
        mockMvc.perform(post("/api/auth/mobile/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.placement.dto.MobileOtpRequest(phone))))
                .andExpect(status().isOk());

        // Set hash
        java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest("654321".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) sb.append(String.format("%02x", b));

        com.placement.entity.MobileOtpToken token = mobileOtpTokenRepository
                .findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc(phone).orElseThrow();
        token.setOtpHash(sb.toString());
        mobileOtpTokenRepository.save(token);

        // Verify OTP
        mockMvc.perform(post("/api/auth/mobile/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.placement.dto.MobileOtpVerifyRequest(phone, "654321"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("RECRUITER"));
    }

    @Test
    @DisplayName("H2: Mobile OTP preserves ADMIN role for existing user")
    void mobileOtpPreservesAdminRole() throws Exception {
        String phone = "+91922" + (System.currentTimeMillis() % 10000000);
        String email = uniqueEmail("admin_phone");
        com.placement.entity.User admin = com.placement.entity.User.builder()
                .email(email)
                .phoneNumber(phone)
                .fullName("Phone Admin")
                .password("encodedPassword")
                .role(com.placement.entity.User.Role.ADMIN)
                .enabled(true)
                .build();
        userRepository.save(admin);

        // Request OTP
        mockMvc.perform(post("/api/auth/mobile/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.placement.dto.MobileOtpRequest(phone))))
                .andExpect(status().isOk());

        // Set hash
        java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest("998877".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) sb.append(String.format("%02x", b));

        com.placement.entity.MobileOtpToken token = mobileOtpTokenRepository
                .findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc(phone).orElseThrow();
        token.setOtpHash(sb.toString());
        mobileOtpTokenRepository.save(token);

        // Verify OTP
        mockMvc.perform(post("/api/auth/mobile/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.placement.dto.MobileOtpVerifyRequest(phone, "998877"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    @DisplayName("H2: Mobile OTP rejects disabled user account with 401")
    void mobileOtpDisabledUser() throws Exception {
        String phone = "+91933" + (System.currentTimeMillis() % 10000000);
        String email = uniqueEmail("disabled_phone");
        com.placement.entity.User disabled = com.placement.entity.User.builder()
                .email(email)
                .phoneNumber(phone)
                .fullName("Disabled Phone User")
                .password("encodedPassword")
                .role(com.placement.entity.User.Role.STUDENT)
                .enabled(false)
                .build();
        userRepository.save(disabled);

        // Request OTP
        mockMvc.perform(post("/api/auth/mobile/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.placement.dto.MobileOtpRequest(phone))))
                .andExpect(status().isOk());

        // Set hash
        java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest("111111".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) sb.append(String.format("%02x", b));

        com.placement.entity.MobileOtpToken token = mobileOtpTokenRepository
                .findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc(phone).orElseThrow();
        token.setOtpHash(sb.toString());
        mobileOtpTokenRepository.save(token);

        // Verify OTP
        mockMvc.perform(post("/api/auth/mobile/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.placement.dto.MobileOtpVerifyRequest(phone, "111111"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Account is disabled. Please contact administrator."));
    }

    @Test
    @DisplayName("H2: Mobile OTP rejects invalid OTP with 401")
    void mobileOtpInvalidOtp() throws Exception {
        String phone = "+91944" + (System.currentTimeMillis() % 10000000);

        // Request OTP
        mockMvc.perform(post("/api/auth/mobile/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.placement.dto.MobileOtpRequest(phone))))
                .andExpect(status().isOk());

        // Verify with wrong OTP
        mockMvc.perform(post("/api/auth/mobile/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.placement.dto.MobileOtpVerifyRequest(phone, "000000"))))
                .andExpect(status().isUnauthorized());
    }
}
