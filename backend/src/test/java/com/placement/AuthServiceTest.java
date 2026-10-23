package com.placement;

import com.placement.config.JwtUtil;
import com.placement.dto.LoginRequest;
import com.placement.dto.RegisterRequest;
import com.placement.entity.User;
import com.placement.repository.UserRepository;
import com.placement.service.AuthService;
import com.placement.service.LoginAttemptService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

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

    @InjectMocks
    private AuthService authService;

@Test
    void registerShouldCreateToken() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("student@example.com");
        request.setPassword("password123");
        request.setRole("STUDENT");

        when(loginAttemptService.isRegistrationAllowed(any())).thenReturn(true);
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(jwtUtil.generateToken(any())).thenReturn("jwt-token");

        var response = authService.register(request);
        assertNotNull(response.getToken());
    }

    @Test
    void loginShouldReturnAuthResponse() {
        LoginRequest request = new LoginRequest();
        request.setEmail("student@example.com");
        request.setPassword("password123");

        User user = User.builder().email("student@example.com").password("encoded").role(User.Role.STUDENT).enabled(true).build();
        when(userRepository.findByEmail(any())).thenReturn(java.util.Optional.of(user));
        when(jwtUtil.generateToken(any())).thenReturn("jwt-token");

        var response = authService.login(request);
        assertNotNull(response.getToken());
    }
}
