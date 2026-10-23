package com.placement.config;

import com.placement.entity.Company;
import com.placement.entity.User;
import com.placement.repository.CompanyRepository;
import com.placement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Seeds DEMO data (company + demo users) for local development ONLY.
 *
 * <p>Guarded by {@code @Profile("dev")}: it will NEVER run in the default or production
 * profile, so it cannot create admin accounts or seed data against a real database.
 * The default admin password is read from an environment variable (DEV_ADMIN_PASSWORD)
 * with a clear dev-only default. It is never intended for production.</p>
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
@Order(1)
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository = null;
    private final CompanyRepository companyRepository = null;
    private final PasswordEncoder passwordEncoder = null;

    @Override
    @Transactional
    public void run(String... args) {
        if (companyRepository.count() > 0) {
            log.info("DataSeeder: companies already present, skipping seed.");
            return;
        }

        // Demo admin password comes from env (dev only). Default provided for convenience.
        String devAdminPassword = System.getenv("DEV_ADMIN_PASSWORD");
        if (devAdminPassword == null || devAdminPassword.isBlank()) {
            devAdminPassword = "admin123";
        }

        // Seed a demo admin
        if (!userRepository.existsByEmail("admin@placement.com")) {
            User admin = User.builder()
                    .email("admin@placement.com")
                    .password(passwordEncoder.encode(devAdminPassword))
                    .role(User.Role.ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            log.info("Seeded admin user: admin@placement.com (dev profile only)");
        }

        // Seed a demo recruiter
        User recruiter = null;
        if (!userRepository.existsByEmail("recruiter@placement.com")) {
            recruiter = User.builder()
                    .email("recruiter@placement.com")
                    .password(passwordEncoder.encode("recruiter123"))
                    .role(User.Role.RECRUITER)
                    .enabled(true)
                    .build();
            recruiter = userRepository.save(recruiter);
            log.info("Seeded recruiter user: recruiter@placement.com (dev profile only)");
        } else {
            recruiter = userRepository.findByEmail("recruiter@placement.com").orElse(null);
        }

        // Seed a default company owned by the demo recruiter
        Company defaultCompany = Company.builder()
                .name("Acme Corp")
                .industry("Information Technology")
                .website("https://acme.com")
                .location("Bengaluru, India")
                .description("A leading technology company providing software solutions.")
                .logo(null)
                .createdAt(LocalDateTime.now())
                .recruiter(recruiter)
                .build();
        companyRepository.save(defaultCompany);
        log.info("Seeded default company: Acme Corp (id={}) (dev profile only)", defaultCompany.getId());
    }
}
