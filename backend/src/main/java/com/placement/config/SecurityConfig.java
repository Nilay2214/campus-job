
package com.placement.config;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService customUserDetailsService;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            CustomUserDetailsService customUserDetailsService) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Autowired(required = false)
    private OAuth2AuthenticationSuccessHandler oauth2AuthenticationSuccessHandler;

    @Autowired(required = false)
    private OAuth2AuthenticationFailureHandler oauth2AuthenticationFailureHandler;

    @Autowired(required = false)
    private ClientRegistrationRepository clientRegistrationRepository;

    // Reads the separate Spring property defined in application.properties.
    // Falls back to CORS_ALLOWED_ORIGINS env var or safe production/dev origins if undefined.
    @Value("${app.cors.allowed-origins:${CORS_ALLOWED_ORIGINS:https://campus-job-amber.vercel.app,http://localhost:3000,http://localhost:5173}}")
    private String corsAllowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
            .csrf(AbstractHttpConfigurer::disable)

            .cors(cors ->
                cors.configurationSource(corsConfigurationSource())
            )

            .authorizeHttpRequests(auth -> auth

                // Browser preflight requests must be processed by CORS.
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Public authentication and infrastructure endpoints.
                .requestMatchers(
                    "/api/auth/**",
                    "/api/public/**",
                    "/error",
                    "/oauth2/**",
                    "/login/oauth2/**",
                    "/actuator/**",
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/api-docs/**"
                ).permitAll()

                // Resume files require controlled access through
                // the application's dedicated resume access endpoint.
                .requestMatchers("/uploads/**").denyAll()

                // Role-based authorization.
                .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")

                .requestMatchers("/api/recruiters/**")
                    .hasAnyRole("RECRUITER", "ADMIN")

                .requestMatchers("/api/students/jobs/**")
                    .hasAnyRole("STUDENT", "RECRUITER", "ADMIN")

                .requestMatchers("/api/students/**")
                    .hasAnyRole("STUDENT", "ADMIN")

                // All other endpoints require authentication.
                .anyRequest().authenticated()
            )

            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .exceptionHandling(ex ->
                ex.authenticationEntryPoint((request, response, exception) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write(
                        "{\"error\":\"Unauthorized\","
                        + "\"message\":\"Authentication required\"}"
                    );
                })
            )

            .authenticationProvider(authenticationProvider())

            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        // Enable Google OAuth2 login only when the required
        // OAuth2 components are available.
        if (clientRegistrationRepository != null
                && oauth2AuthenticationSuccessHandler != null
                && oauth2AuthenticationFailureHandler != null) {

            http.oauth2Login(oauth2 ->
                oauth2
                    .clientRegistrationRepository(
                        clientRegistrationRepository
                    )
                    .successHandler(oauth2AuthenticationSuccessHandler)
                    .failureHandler(oauth2AuthenticationFailureHandler)
            );
        }

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider =
            new DaoAuthenticationProvider();

        authProvider.setUserDetailsService(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        List<String> origins = splitOrigins(corsAllowedOrigins);

        // Fallback if the configured list is empty.
        if (origins.isEmpty()) {
            origins = Arrays.asList(
                "https://campus-job-amber.vercel.app",
                "http://localhost:3000",
                "http://localhost:5173"
            );
        }

        CorsConfiguration configuration = new CorsConfiguration();

        // Explicitly configured origins.
        configuration.setAllowedOrigins(origins);

        // Restrict preview deployments to the campus-job project
        // prefix. Do not trust every *.vercel.app domain.
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "https://campus-job-*.vercel.app",
            "http://localhost:[*]",
            "http://127.0.0.1:[*]"
        ));

        configuration.setAllowedMethods(Arrays.asList(
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ));

        configuration.setAllowedHeaders(
            Collections.singletonList("*")
        );

        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Link",
            "X-Total-Count"
        ));

        // Retained from the existing security configuration.
        // This is needed if the application uses cross-origin cookies
        // or other credentialed browser requests.
        configuration.setAllowCredentials(true);

        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    private List<String> splitOrigins(String value) {
        if (value == null || value.isBlank()) {
            return Collections.emptyList();
        }

        return Arrays.stream(value.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isEmpty())
            .distinct()
            .collect(Collectors.toList());
    }
}
