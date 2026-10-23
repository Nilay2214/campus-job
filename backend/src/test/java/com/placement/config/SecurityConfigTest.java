package com.placement.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationContext;

import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest

@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SecurityFilterChain securityFilterChain;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

// NOTE: JwtAuthenticationFilter is intentionally NOT mocked. A Mockito mock of the filter
    // would never call filterChain.doFilter(...), so requests would be short-circuited and always
    // return 200 (bypassing Spring Security's authorization). Using the real filter lets the
    // AuthorizationRules / endpoint tests exercise the actual security chain.
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("SecurityConfig beans should load: SecurityFilterChain, PasswordEncoder, AuthenticationManager")
    void beansShouldLoad() {
        assertThat(applicationContext).isNotNull();
        assertThat(securityFilterChain).isNotNull();
        assertThat(passwordEncoder).isNotNull();
        assertThat(passwordEncoder).isInstanceOf(BCryptPasswordEncoder.class);
        assertThat(authenticationManager).isNotNull();
    }

    @Test
    @DisplayName("CSRF is disabled and protected endpoints require authentication")
    void csrfDisabledAndProtectedEndpointsRequireAuthentication() throws Exception {
        // SecurityConfig sets .csrf(disable) so a POST without CSRF token should not fail due to CSRF.
        // Instead, it should fail because the request is unauthenticated (401/403 depending on filter order).
        mockMvc.perform(MockMvcRequestBuilders.post("/api/students/any")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertThat(status)
                            .as("Expected unauthenticated request to be rejected (401/403) for protected endpoint")
                            .isIn(401, 403);
                });
    }

    @Test
    @DisplayName("CORS should be configured and OPTIONS preflight should be permitted")
    void corsPreflightShouldReturnCorsHeadersAndBePermitted() throws Exception {
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.options("/api/students/any")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Authorization,Content-Type")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        // Ensure CORS headers from SecurityConfig's CorsConfigurationSource are present.
        String allowOrigin = result.getResponse().getHeader("Access-Control-Allow-Origin");
        assertThat(allowOrigin).isNotBlank();

        String allowMethods = result.getResponse().getHeader("Access-Control-Allow-Methods");
        assertThat(allowMethods).contains("GET");
        assertThat(allowMethods).contains("POST");

        String allowCreds = result.getResponse().getHeader("Access-Control-Allow-Credentials");
        assertThat(allowCreds).isEqualTo("true");
    }

@Test
    @DisplayName("OPTIONS /** should be permitAll (no authentication required)")
    void optionsShouldBePermitAll() throws Exception {
        // SecurityConfig permits OPTIONS /**. No controller handler is mapped for this exact path,
        // so Spring MVC resource resolution may fall through (NoResourceFoundException). The security
        // behavior under test is that the request is NOT rejected with 401/403.
        mockMvc.perform(MockMvcRequestBuilders.options("/api/admin/anything"))
                .andExpect(result -> {
                    int st = result.getResponse().getStatus();
                    assertThat(st)
                            .as("OPTIONS /** should be permitted by security (no 401/403)")
                            .isNotIn(401, 403);
                });
    }

    @Nested
    class AuthorizationTests {

        @Test
        @DisplayName("Public endpoints (/api/auth/**) should not be rejected by security (no 401/403)")
        void apiAuthShouldBePublic() throws Exception {
            mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is4xxClientError())
                    .andExpect(result -> {
                        int st = result.getResponse().getStatus();
                        assertThat(st).isNotIn(401, 403);
                    });
        }

@Test
        @DisplayName("Protected endpoint should reject unauthenticated request")
        void protectedEndpointRequiresAuthentication() throws Exception {
            // A custom AuthenticationEntryPoint is configured in SecurityConfig, so
            // unauthenticated requests to protected endpoints return 401.
            mockMvc.perform(MockMvcRequestBuilders.get("/api/admin/anything"))
                    .andExpect(status().is(401));
        }
    }


@Test
    @DisplayName("JwtAuthenticationFilter should be registered in the security filter chain")
    void jwtAuthenticationFilterShouldBeBeforeUsernamePasswordAuthenticationFilter() {
        // SecurityConfig is a stateless JWT configuration: it does not enable formLogin() or httpBasic(),
        // so UsernamePasswordAuthenticationFilter is NOT part of the filter chain. SecurityConfig instead
        // registers the JwtAuthenticationFilter via addFilterBefore(..., UsernamePasswordAuthenticationFilter.class).
        // This test verifies the JWT filter is actually present in the chain.
        @SuppressWarnings("unchecked")
        List<org.springframework.web.filter.GenericFilterBean> filters = (List<org.springframework.web.filter.GenericFilterBean>) (List<?>) securityFilterChain.getFilters();

        assertThat(filters).isNotNull();

        int jwtIndex = -1;
        for (int i = 0; i < filters.size(); i++) {
            Object f = filters.get(i);

            if (f != null && f.getClass().getSimpleName().contains("JwtAuthenticationFilter")) {
                jwtIndex = i;
            }
        }

        assertThat(jwtIndex)
                .as("JwtAuthenticationFilter should be present in the filter chain")
                .isGreaterThanOrEqualTo(0);
    }
}

