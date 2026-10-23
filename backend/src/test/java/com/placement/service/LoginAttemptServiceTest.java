package com.placement.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Tests for the in-memory login lockout and registration rate-limiting
 * in {@link LoginAttemptService}.
 */
class LoginAttemptServiceTest {

    private LoginAttemptService newService(int maxAttempts, long lockoutMinutes,
                                           int maxRegistrations, long regWindowMinutes) {
        return new LoginAttemptService(maxAttempts, lockoutMinutes, maxRegistrations, regWindowMinutes);
    }

    // ---------- Login lockout ----------

    @Test
    void failedAttempts_lockAccountAfterMaxAttempts() {
        LoginAttemptService service = newService(5, 15, 3, 60);

        assertFalse(service.isLocked("user@example.com"));
        for (int i = 0; i < 5; i++) {
            service.onFailedAttempt("user@example.com");
        }
        assertTrue(service.isLocked("user@example.com"));
    }

    @Test
    void successfulLogin_resetsFailedAttempts() {
        LoginAttemptService service = newService(5, 15, 3, 60);

        for (int i = 0; i < 4; i++) {
            service.onFailedAttempt("user@example.com");
        }
        assertFalse(service.isLocked("user@example.com"));

        service.onSuccessfulLogin("user@example.com");
        // After a success, the counter resets, so more failures won't lock immediately.
        for (int i = 0; i < 4; i++) {
            service.onFailedAttempt("user@example.com");
        }
        assertFalse(service.isLocked("user@example.com"));
    }

    @Test
    void lockout_isCaseInsensitiveAndTrimmed() {
        LoginAttemptService service = newService(5, 15, 3, 60);

        service.onFailedAttempt("User@Example.com");
        service.onFailedAttempt(" user@example.com ");
        assertFalse(service.isLocked("USER@EXAMPLE.COM"));
    }

    // ---------- Registration rate limiting ----------

    @Test
    void registrations_areAllowedUpToWindowLimit() {
        LoginAttemptService service = newService(5, 15, 3, 60);

        assertTrue(service.isRegistrationAllowed("student@example.com"));
        assertTrue(service.isRegistrationAllowed("student@example.com"));
        assertTrue(service.isRegistrationAllowed("student@example.com"));
        // Fourth registration in the same window is rejected.
        assertFalse(service.isRegistrationAllowed("student@example.com"));
    }

    @Test
    void differentEmails_haveIndependentLimits() {
        LoginAttemptService service = newService(5, 15, 3, 60);

        assertTrue(service.isRegistrationAllowed("a@example.com"));
        assertTrue(service.isRegistrationAllowed("a@example.com"));
        assertTrue(service.isRegistrationAllowed("a@example.com"));
        assertFalse(service.isRegistrationAllowed("a@example.com"));

        // A different email is not limited by the first one's counter.
        assertTrue(service.isRegistrationAllowed("b@example.com"));
    }
}
