package com.placement.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.util.ArrayList;
import java.util.List;

/**
 * Fails fast at startup when required environment variables are missing.
 *
 * <p>Spring's placeholder {@code ${DB_PASSWORD}} (with no default) already fails if the
 * property is absent, but this validator gives a clearer, centralized error message and
 * also protects values that are only referenced without a placeholder default check.</p>
 */
@Configuration
public class EnvConfigValidator {

    private static final Logger log = LoggerFactory.getLogger(EnvConfigValidator.class);

    private final Environment environment;

    public EnvConfigValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validate() {
        List<String> missing = new ArrayList<>();

        // DB_PASSWORD is mandatory (no safe default).
        if (isBlank(property("DB_PASSWORD"))) {
            missing.add("DB_PASSWORD");
        }

        // Production profile: JWT_SECRET must be explicitly provided.
        boolean prod = profilesContain("prod");
        if (prod && isBlank(property("JWT_SECRET"))) {
            missing.add("JWT_SECRET");
        }

        if (!missing.isEmpty()) {
            String message = "Missing required environment variable(s): " + String.join(", ", missing)
                    + ". Refusing to start with insecure defaults. Please set them in the environment "
                    + "or .env file before starting the application.";
            log.error(message);
            throw new IllegalStateException(message);
        }
    }

    private String property(String key) {
        try {
            return environment.getProperty(key);
        } catch (Exception ex) {
            // Placeholder resolution failure -> treat as missing.
            return null;
        }
    }

    private boolean profilesContain(String profileName) {
        if (environment.getActiveProfiles() == null) {
            return false;
        }
        for (String p : environment.getActiveProfiles()) {
            if (p != null && p.equalsIgnoreCase(profileName)) {
                return true;
            }
        }
        return false;
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
