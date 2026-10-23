package com.placement.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class FirebaseTokenVerifier {

    private static final String GOOGLE_JWKS_URI =
            "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
    private static final String ISSUER_PREFIX = "https://securetoken.google.com/";

    @Value("${app.firebase.project-id:${FIREBASE_PROJECT_ID:}}")
    private String configuredProjectId;

    private JwtDecoder jwtDecoder;

    public FirebaseTokenVerifier() {
        // Default constructor
    }

    public FirebaseTokenVerifier(JwtDecoder jwtDecoder, String configuredProjectId) {
        this.jwtDecoder = jwtDecoder;
        this.configuredProjectId = configuredProjectId;
    }

    private synchronized JwtDecoder getDecoder() {
        if (this.jwtDecoder == null) {
            this.jwtDecoder = NimbusJwtDecoder.withJwkSetUri(GOOGLE_JWKS_URI).build();
        }
        return this.jwtDecoder;
    }

    public FirebaseUserData verifyToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new BadCredentialsException("Firebase ID token is missing or empty");
        }

        try {
            Jwt jwt = getDecoder().decode(idToken.trim());

            String issuer = jwt.getIssuer() != null ? jwt.getIssuer().toString() : "";
            if (!issuer.startsWith(ISSUER_PREFIX)) {
                throw new BadCredentialsException("Invalid Firebase token issuer: " + issuer);
            }

            String tokenProjectId = issuer.substring(ISSUER_PREFIX.length());
            if (tokenProjectId.isBlank()) {
                throw new BadCredentialsException("Invalid project ID in Firebase token issuer");
            }

            // If a specific project ID is configured in backend environment, enforce exact match
            if (configuredProjectId != null && !configuredProjectId.isBlank()) {
                if (!configuredProjectId.trim().equals(tokenProjectId)) {
                    throw new BadCredentialsException("Token was issued for unexpected project: " + tokenProjectId);
                }
                List<String> audience = jwt.getAudience();
                if (audience == null || !audience.contains(configuredProjectId.trim())) {
                    throw new BadCredentialsException("Token audience does not match configured Firebase project");
                }
            }

            String uid = jwt.getSubject();
            if (uid == null || uid.isBlank()) {
                throw new BadCredentialsException("Firebase token subject (UID) is missing");
            }

            String email = jwt.getClaimAsString("email");
            if (email == null || email.isBlank()) {
                throw new BadCredentialsException("Firebase token does not contain an email address");
            }

            Boolean emailVerified = jwt.getClaimAsBoolean("email_verified");
            String name = jwt.getClaimAsString("name");

            return new FirebaseUserData(uid, email.trim().toLowerCase(), name != null ? name.trim() : null, Boolean.TRUE.equals(emailVerified));
        } catch (BadCredentialsException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Firebase token verification failed: {}", ex.getMessage());
            throw new BadCredentialsException("Invalid or expired Firebase ID token: " + ex.getMessage(), ex);
        }
    }

    public record FirebaseUserData(String uid, String email, String name, boolean emailVerified) {}
}
