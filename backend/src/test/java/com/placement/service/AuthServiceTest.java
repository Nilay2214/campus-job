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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private LoginAttemptService loginAttemptService;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private MobileOtpTokenRepository mobileOtpTokenRepository;

    @Mock
    private SmsService smsService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                passwordEncoder,
                authenticationManager,
                jwtUtil,
                loginAttemptService,
                passwordResetTokenRepository,
                emailService,
                mobileOtpTokenRepository,
                smsService
        );
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
            throw new RuntimeException(ex);
        }
    }

    @Test
    void register_whenEmailDoesNotExist_encodesPassword_savesUser_generatesToken() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("John Doe");
        request.setEmail("user@example.com");
        request.setPassword("rawPassword");
        request.setRole(User.Role.STUDENT.name());

        when(loginAttemptService.isRegistrationAllowed(any())).thenReturn(true);
        when(userRepository.existsByEmail("user@example.com")).thenReturn(false);
        when(passwordEncoder.encode("rawPassword")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("jwt-token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals(User.Role.STUDENT.name(), response.getRole());
        assertEquals("Registration successful", response.getMessage());

        verify(passwordEncoder).encode("rawPassword");
    }

    @Test
    void login_whenCredentialsValid_returnsTokenAndResetsAttempts() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@example.com");
        request.setPassword("correctPassword");

        Authentication auth = mock(Authentication.class);
        when(loginAttemptService.isLocked("user@example.com")).thenReturn(false);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);

        User user = User.builder()
                .email("user@example.com")
                .password("encodedPassword")
                .role(User.Role.STUDENT)
                .enabled(true)
                .build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("jwt-token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals(User.Role.STUDENT.name(), response.getRole());
        verify(loginAttemptService).onSuccessfulLogin("user@example.com");
    }

    @Test
    void processOAuthPostLogin_whenUserDoesNotExist_createsStudentUserAndReturnsToken() {
        when(userRepository.findByEmail("newgoogle@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("encodedRandomPass");
        when(jwtUtil.generateToken(any())).thenReturn("jwt-google-student");

        AuthResponse response = authService.processOAuthPostLogin("newgoogle@example.com", "Google Student", "sub123", "GOOGLE");

        assertNotNull(response);
        assertEquals("STUDENT", response.getRole());
        assertEquals("jwt-google-student", response.getToken());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User saved = userCaptor.getValue();
        assertEquals("newgoogle@example.com", saved.getEmail());
        assertEquals("Google Student", saved.getFullName());
        assertEquals(User.Role.STUDENT, saved.getRole());
        assertTrue(saved.isEnabled());
    }

    @Test
    void processOAuthPostLogin_whenUserExistsAsRecruiter_preservesRecruiterRole() {
        User existing = User.builder()
                .id(10L)
                .email("recruiter@example.com")
                .fullName("Existing Recruiter")
                .role(User.Role.RECRUITER)
                .enabled(true)
                .build();
        when(userRepository.findByEmail("recruiter@example.com")).thenReturn(Optional.of(existing));
        when(jwtUtil.generateToken(any())).thenReturn("jwt-google-recruiter");

        AuthResponse response = authService.processOAuthPostLogin("recruiter@example.com", "Google Recruiter", "sub456", "GOOGLE");

        assertNotNull(response);
        assertEquals("RECRUITER", response.getRole());
        assertEquals("jwt-google-recruiter", response.getToken());
    }

    @Test
    void processOAuthPostLogin_whenUserExistsAsAdmin_preservesAdminRole() {
        User existing = User.builder()
                .id(1L)
                .email("admin@example.com")
                .fullName("Existing Admin")
                .role(User.Role.ADMIN)
                .enabled(true)
                .build();
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(existing));
        when(jwtUtil.generateToken(any())).thenReturn("jwt-google-admin");

        AuthResponse response = authService.processOAuthPostLogin("admin@example.com", "Admin Name", "sub789", "GOOGLE");

        assertNotNull(response);
        assertEquals("ADMIN", response.getRole());
        assertEquals("jwt-google-admin", response.getToken());
    }

    @Test
    void processOAuthPostLogin_whenUserIsDisabled_throwsDisabledException() {
        User disabled = User.builder()
                .id(11L)
                .email("disabled@example.com")
                .role(User.Role.STUDENT)
                .enabled(false)
                .build();
        when(userRepository.findByEmail("disabled@example.com")).thenReturn(Optional.of(disabled));

        assertThrows(DisabledException.class,
                () -> authService.processOAuthPostLogin("disabled@example.com", "Disabled User", "sub999", "GOOGLE"));
    }

    // ==========================================
    // MOBILE OTP TESTS
    // ==========================================

    @Test
    void requestMobileOtp_success() {
        when(mobileOtpTokenRepository.countByPhoneNumberAndCreatedAtAfter(eq("+919876543210"), any())).thenReturn(0L);
        when(mobileOtpTokenRepository.findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc("+919876543210"))
                .thenReturn(Optional.empty());

        String message = authService.requestMobileOtp("+919876543210");

        assertEquals("OTP has been sent to your mobile number.", message);
        verify(mobileOtpTokenRepository).save(any(MobileOtpToken.class));
        verify(smsService).sendOtp(eq("+919876543210"), contains("Campus Job"));
    }

    @Test
    void requestMobileOtp_whenCooldownActive_throwsIllegalStateException() {
        MobileOtpToken recentToken = MobileOtpToken.builder()
                .phoneNumber("+919876543210")
                .createdAt(LocalDateTime.now().minusSeconds(10)) // 10 seconds ago, within 60s cooldown
                .used(false)
                .build();

        when(mobileOtpTokenRepository.countByPhoneNumberAndCreatedAtAfter(eq("+919876543210"), any())).thenReturn(1L);
        when(mobileOtpTokenRepository.findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc("+919876543210"))
                .thenReturn(Optional.of(recentToken));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> authService.requestMobileOtp("+919876543210"));

        assertTrue(ex.getMessage().contains("Please wait"));
        verify(smsService, never()).sendOtp(anyString(), anyString());
    }

    @Test
    void requestMobileOtp_whenRateLimitExceeded_throwsIllegalStateException() {
        when(mobileOtpTokenRepository.countByPhoneNumberAndCreatedAtAfter(eq("+919876543210"), any())).thenReturn(5L);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> authService.requestMobileOtp("+919876543210"));

        assertTrue(ex.getMessage().contains("Too many OTP requests"));
        verify(smsService, never()).sendOtp(anyString(), anyString());
    }

    @Test
    void requestMobileOtp_whenInvalidPhone_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> authService.requestMobileOtp("123"));
        assertThrows(IllegalArgumentException.class, () -> authService.requestMobileOtp("invalid-phone-abc"));
    }

    @Test
    void verifyMobileOtp_whenNewUser_createsStudentAccountAndReturnsToken() {
        String rawOtp = "123456";
        MobileOtpToken token = MobileOtpToken.builder()
                .phoneNumber("+919876543210")
                .otpHash(sha256(rawOtp))
                .expiry(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .used(false)
                .build();

        when(mobileOtpTokenRepository.findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc("+919876543210"))
                .thenReturn(Optional.of(token));
        when(userRepository.findByPhoneNumber("+919876543210")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("jwt-mobile-student");

        AuthResponse response = authService.verifyMobileOtp("+919876543210", rawOtp);

        assertNotNull(response);
        assertEquals("STUDENT", response.getRole());
        assertEquals("jwt-mobile-student", response.getToken());
        assertTrue(token.isUsed());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("+919876543210", savedUser.getPhoneNumber());
        assertTrue(savedUser.isPhoneVerified());
        assertTrue(savedUser.isEnabled());
        assertEquals(User.Role.STUDENT, savedUser.getRole());
    }

    @Test
    void verifyMobileOtp_whenExistingRecruiter_preservesRecruiterRole() {
        String rawOtp = "654321";
        MobileOtpToken token = MobileOtpToken.builder()
                .phoneNumber("+919876543210")
                .otpHash(sha256(rawOtp))
                .expiry(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .used(false)
                .build();

        User existingRecruiter = User.builder()
                .id(20L)
                .email("recruiter@example.com")
                .phoneNumber("+919876543210")
                .role(User.Role.RECRUITER)
                .enabled(true)
                .build();

        when(mobileOtpTokenRepository.findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc("+919876543210"))
                .thenReturn(Optional.of(token));
        when(userRepository.findByPhoneNumber("+919876543210")).thenReturn(Optional.of(existingRecruiter));
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("jwt-mobile-recruiter");

        AuthResponse response = authService.verifyMobileOtp("+919876543210", rawOtp);

        assertNotNull(response);
        assertEquals("RECRUITER", response.getRole());
        assertEquals("jwt-mobile-recruiter", response.getToken());
        assertTrue(existingRecruiter.isPhoneVerified());
    }

    @Test
    void verifyMobileOtp_whenExistingAdmin_preservesAdminRole() {
        String rawOtp = "112233";
        MobileOtpToken token = MobileOtpToken.builder()
                .phoneNumber("+919876543210")
                .otpHash(sha256(rawOtp))
                .expiry(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .used(false)
                .build();

        User existingAdmin = User.builder()
                .id(1L)
                .email("admin@example.com")
                .phoneNumber("+919876543210")
                .role(User.Role.ADMIN)
                .enabled(true)
                .build();

        when(mobileOtpTokenRepository.findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc("+919876543210"))
                .thenReturn(Optional.of(token));
        when(userRepository.findByPhoneNumber("+919876543210")).thenReturn(Optional.of(existingAdmin));
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("jwt-mobile-admin");

        AuthResponse response = authService.verifyMobileOtp("+919876543210", rawOtp);

        assertNotNull(response);
        assertEquals("ADMIN", response.getRole());
        assertEquals("jwt-mobile-admin", response.getToken());
    }

    @Test
    void verifyMobileOtp_whenUserDisabled_throwsDisabledException() {
        String rawOtp = "123456";
        MobileOtpToken token = MobileOtpToken.builder()
                .phoneNumber("+919876543210")
                .otpHash(sha256(rawOtp))
                .expiry(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .used(false)
                .build();

        User disabledUser = User.builder()
                .id(5L)
                .email("disabled@example.com")
                .phoneNumber("+919876543210")
                .role(User.Role.STUDENT)
                .enabled(false)
                .build();

        when(mobileOtpTokenRepository.findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc("+919876543210"))
                .thenReturn(Optional.of(token));
        when(userRepository.findByPhoneNumber("+919876543210")).thenReturn(Optional.of(disabledUser));

        assertThrows(DisabledException.class,
                () -> authService.verifyMobileOtp("+919876543210", rawOtp));
    }

    @Test
    void verifyMobileOtp_whenInvalidOtp_incrementsAttempts() {
        MobileOtpToken token = MobileOtpToken.builder()
                .phoneNumber("+919876543210")
                .otpHash(sha256("123456"))
                .expiry(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .used(false)
                .build();

        when(mobileOtpTokenRepository.findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc("+919876543210"))
                .thenReturn(Optional.of(token));

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> authService.verifyMobileOtp("+919876543210", "999999"));

        assertTrue(ex.getMessage().contains("2 attempt(s) remaining"));
        assertEquals(1, token.getAttempts());
        assertFalse(token.isUsed());
    }

    @Test
    void verifyMobileOtp_whenExpired_throwsBadCredentialsException() {
        MobileOtpToken token = MobileOtpToken.builder()
                .phoneNumber("+919876543210")
                .otpHash(sha256("123456"))
                .expiry(LocalDateTime.now().minusMinutes(1)) // Expired 1 min ago
                .attempts(0)
                .used(false)
                .build();

        when(mobileOtpTokenRepository.findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc("+919876543210"))
                .thenReturn(Optional.of(token));

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> authService.verifyMobileOtp("+919876543210", "123456"));

        assertTrue(ex.getMessage().contains("expired"));
        assertTrue(token.isUsed());
    }

    @Test
    void verifyMobileOtp_whenNoActiveToken_throwsBadCredentialsException() {
        when(mobileOtpTokenRepository.findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc("+919876543210"))
                .thenReturn(Optional.empty());

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> authService.verifyMobileOtp("+919876543210", "123456"));

        assertTrue(ex.getMessage().contains("No active OTP request"));
    }
}
