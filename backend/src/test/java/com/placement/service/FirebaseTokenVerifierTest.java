package com.placement.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidationException;

import java.net.URL;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FirebaseTokenVerifierTest {

    @Mock
    private JwtDecoder jwtDecoder;

    private FirebaseTokenVerifier verifier;

    @BeforeEach
    void setUp() {
        verifier = new FirebaseTokenVerifier(jwtDecoder, "test-project-123");
    }

    @Test
    void verifyToken_whenValidToken_returnsFirebaseUserData() throws Exception {
        Jwt jwt = new Jwt(
                "mock-token-value",
                Instant.now().minusSeconds(60),
                Instant.now().plusSeconds(3600),
                Map.of("alg", "RS256", "kid", "key123"),
                Map.of(
                        "iss", new URL("https://securetoken.google.com/test-project-123"),
                        "aud", List.of("test-project-123"),
                        "sub", "google-uid-12345",
                        "email", "student@example.com",
                        "name", "Test Student",
                        "email_verified", true
                )
        );

        when(jwtDecoder.decode("mock-valid-id-token")).thenReturn(jwt);

        FirebaseTokenVerifier.FirebaseUserData result = verifier.verifyToken("mock-valid-id-token");

        assertNotNull(result);
        assertEquals("google-uid-12345", result.uid());
        assertEquals("student@example.com", result.email());
        assertEquals("Test Student", result.name());
        assertTrue(result.emailVerified());
    }

    @Test
    void verifyToken_whenTokenMissingOrBlank_throwsBadCredentials() {
        assertThrows(BadCredentialsException.class, () -> verifier.verifyToken(null));
        assertThrows(BadCredentialsException.class, () -> verifier.verifyToken("   "));
    }

    @Test
    void verifyToken_whenIssuerInvalid_throwsBadCredentials() throws Exception {
        Jwt jwt = new Jwt(
                "mock-token-value",
                Instant.now().minusSeconds(60),
                Instant.now().plusSeconds(3600),
                Map.of("alg", "RS256"),
                Map.of(
                        "iss", new URL("https://accounts.google.com"),
                        "aud", List.of("test-project-123"),
                        "sub", "uid-1",
                        "email", "user@example.com"
                )
        );

        when(jwtDecoder.decode("invalid-issuer-token")).thenReturn(jwt);

        assertThrows(BadCredentialsException.class, () -> verifier.verifyToken("invalid-issuer-token"));
    }

    @Test
    void verifyToken_whenProjectIdMismatch_throwsBadCredentials() throws Exception {
        Jwt jwt = new Jwt(
                "mock-token-value",
                Instant.now().minusSeconds(60),
                Instant.now().plusSeconds(3600),
                Map.of("alg", "RS256"),
                Map.of(
                        "iss", new URL("https://securetoken.google.com/different-project"),
                        "aud", List.of("different-project"),
                        "sub", "uid-1",
                        "email", "user@example.com"
                )
        );

        when(jwtDecoder.decode("wrong-project-token")).thenReturn(jwt);

        assertThrows(BadCredentialsException.class, () -> verifier.verifyToken("wrong-project-token"));
    }

    @Test
    void verifyToken_whenEmailMissing_throwsBadCredentials() throws Exception {
        Jwt jwt = new Jwt(
                "mock-token-value",
                Instant.now().minusSeconds(60),
                Instant.now().plusSeconds(3600),
                Map.of("alg", "RS256"),
                Map.of(
                        "iss", new URL("https://securetoken.google.com/test-project-123"),
                        "aud", List.of("test-project-123"),
                        "sub", "uid-1"
                )
        );

        when(jwtDecoder.decode("missing-email-token")).thenReturn(jwt);

        assertThrows(BadCredentialsException.class, () -> verifier.verifyToken("missing-email-token"));
    }

    @Test
    void verifyToken_whenDecoderThrows_wrapsInBadCredentials() {
        when(jwtDecoder.decode("expired-token")).thenThrow(new org.springframework.security.oauth2.jwt.BadJwtException("Token expired"));

        assertThrows(BadCredentialsException.class, () -> verifier.verifyToken("expired-token"));
    }
}
