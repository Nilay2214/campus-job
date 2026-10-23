package com.placement.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory login attempt tracker providing simple rate limiting / account lockout.
 *
 * <p>Features:
 * <ul>
 *   <li>Tracks consecutive failed attempts per username.</li>
 *   <li>Locks an account after {@code maxAttempts} failed attempts.</li>
 *   <li>Lock persists for {@code lockoutMinutes}.</li>
 *   <li>Successful login resets the counter.</li>
 *   <li>Entries older than the lockout window are lazily expired.</li>
 * </ul>
 *
 * <p>No passwords or JWT tokens are stored. This is intentionally dependency-free and
 * in-memory (lost on restart), suitable for a single-instance deployment. For multi-instance
 * or distributed deployments, replace with Redis or a database-backed store.</p>
 */
@Service
public class LoginAttemptService {

private final int maxAttempts;
    private final long lockoutWindowMillis;
    private final int maxRegistrationsPerWindow;
    private final long registrationWindowMillis;

    private final Map<String, AttemptEntry> attempts = new ConcurrentHashMap<>();
    private final Map<String, RegistrationEntry> registrationCounts = new ConcurrentHashMap<>();

    public LoginAttemptService(
            @Value("${app.login.max-attempts:5}") int maxAttempts,
            @Value("${app.login.lockout-minutes:15}") long lockoutMinutes,
            @Value("${app.registration.max-per-window:3}") int maxRegistrationsPerWindow,
            @Value("${app.registration.window-minutes:60}") long registrationWindowMinutes) {
        this.maxAttempts = Math.max(1, maxAttempts);
        this.lockoutWindowMillis = Math.max(1, lockoutMinutes) * 60_000L;
        this.maxRegistrationsPerWindow = Math.max(1, maxRegistrationsPerWindow);
        this.registrationWindowMillis = Math.max(1, registrationWindowMinutes) * 60_000L;
    }

    /**
     * Returns true if the account is currently locked due to too many failed attempts.
     */
    public boolean isLocked(String username) {
        if (username == null) {
            return false;
        }
        AttemptEntry entry = attempts.get(normalize(username));
        if (entry == null) {
            return false;
        }
        // Expire old entries lazily.
        if (entry.unlockAt <= Instant.now().toEpochMilli()) {
            attempts.remove(normalize(username));
            return false;
        }
        return entry.failures >= maxAttempts;
    }

    /**
     * Records a failed attempt. Returns true if the account just became locked.
     */
    public boolean onFailedAttempt(String username) {
        String key = normalize(username);
        long now = Instant.now().toEpochMilli();
        AttemptEntry entry = attempts.compute(key, (k, existing) -> {
            AttemptEntry base = existing;
            if (base == null || base.unlockAt <= now) {
                base = new AttemptEntry();
            }
            base.failures += 1;
            base.unlockAt = now + lockoutWindowMillis;
            return base;
        });
        return entry.failures >= maxAttempts;
    }

    /**
     * Resets the attempt counter after a successful login.
     */
    public void onSuccessfulLogin(String username) {
        if (username != null) {
            attempts.remove(normalize(username));
        }
    }

    /**
     * Records a registration attempt for the given email/IP and returns true if
     * the registration should be rejected (rate limit exceeded).
     *
     * <p>This is a simple in-memory guard against mass account creation. It is
     * single-instance protection only — for multi-instance or distributed
     * deployments, replace with a shared store (Redis / DB).</p>
     */
    public boolean isRegistrationAllowed(String key) {
        String normalizedKey = normalize(key);
        long now = Instant.now().toEpochMilli();
        boolean allowed = false;
        synchronized (registrationCounts) {
            RegistrationEntry entry = registrationCounts.get(normalizedKey);
            if (entry == null || entry.windowStart > now) {
                entry = new RegistrationEntry();
                registrationCounts.put(normalizedKey, entry);
            }
            // Reset the window if it has elapsed.
            if (entry.windowStart + registrationWindowMillis <= now) {
                entry.count = 0;
                entry.windowStart = now;
            }
            allowed = entry.count < maxRegistrationsPerWindow;
            if (allowed) {
                entry.count += 1;
            }
        }
        return allowed;
    }

    /**
     * Clears all entries. Primarily useful for tests and admin unlock operations.
     */
    public void resetAll() {
        attempts.clear();
        registrationCounts.clear();
    }

    private String normalize(String username) {
        return username == null ? "" : username.trim().toLowerCase();
    }

    private static final class AttemptEntry {
        int failures;
        long unlockAt;
    }

    private static final class RegistrationEntry {
        int count;
        long windowStart = Instant.now().toEpochMilli();
    }
}
