package com.placement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.placement.config.CustomUserDetailsService;
import com.placement.config.JwtAuthenticationFilter;
import com.placement.config.JwtUtil;
import com.placement.config.SecurityConfig;
import com.placement.dto.ApplicationDTO;
import com.placement.entity.Application;
import com.placement.exception.GlobalExceptionHandler;
import com.placement.service.ApplicationService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;


import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ApplicationController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ApplicationService applicationService;

    // @WebMvcTest loads the security filter chain (a JWT SecurityConfig is imported so that
    // @EnableMethodSecurity and @PreAuthorize are enforced). Standard @WebMvcTest collaborator
    // mocks for the JWT infra.
    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    // The mocked JWT filter must not short-circuit the chain. Stub it to pass every request
    // through to the rest of the security filter chain.
@BeforeEach
    void setUp() throws Exception {
        doAnswer(invocation -> {
            HttpServletRequest request = invocation.getArgument(0);
            HttpServletResponse response = invocation.getArgument(1);
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(request, response);
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

@Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("POST /api/applications/{jobId} should return 200 and application body")
    void applyForJob_returnsApplication() throws Exception {

        ApplicationDTO app = ApplicationDTO.builder()
                .id(10L)
                .status("PENDING")
                .build();

        Mockito.when(applicationService.applyToJob(eq(5L))).thenReturn(app);

        mockMvc.perform(post("/api/applications/5"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(10)))
                .andExpect(jsonPath("$.status", is("PENDING")));

        Mockito.verify(applicationService).applyToJob(5L);
        Mockito.verifyNoMoreInteractions(applicationService);
    }

@Test
    @DisplayName("POST /api/applications/{jobId} should be rejected when unauthenticated")
    void applyForJob_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/applications/5"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("POST /api/applications/{jobId} should map IllegalArgumentException to 400 via GlobalExceptionHandler")
    void applyForJob_whenServiceThrowsIllegalArgument_mapsTo400() throws Exception {

        Mockito.when(applicationService.applyToJob(eq(5L)))
                .thenThrow(new IllegalArgumentException("Job is not active"));

        mockMvc.perform(post("/api/applications/5"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error", containsString("Job is not active")));

        Mockito.verify(applicationService).applyToJob(5L);
        Mockito.verifyNoMoreInteractions(applicationService);
    }

@Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("GET /api/applications should return 200 and list body for authenticated STUDENT")
    void myApplications_authenticatedStudent_returnsList() throws Exception {

ApplicationDTO a1 = ApplicationDTO.builder().id(1L).status("PENDING").build();
        ApplicationDTO a2 = ApplicationDTO.builder().id(2L).status("PENDING").build();

        Mockito.when(applicationService.getMyApplications()).thenReturn(List.of(a1, a2));

        mockMvc.perform(get("/api/applications"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[1].id", is(2)));

        Mockito.verify(applicationService).getMyApplications();
        Mockito.verifyNoMoreInteractions(applicationService);
    }

@Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("GET /api/applications should return 200 with empty list when student has no applications")
    void myApplications_authenticatedStudent_emptyList() throws Exception {

        Mockito.when(applicationService.getMyApplications()).thenReturn(List.of());

        mockMvc.perform(get("/api/applications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        Mockito.verify(applicationService).getMyApplications();
        Mockito.verifyNoMoreInteractions(applicationService);
    }

@Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("DELETE /api/applications/{applicationId} should return 204 for authenticated STUDENT when withdraw succeeds")

    void withdrawApplication_authenticatedStudent_returnsNoContent() throws Exception {
        Mockito.doNothing().when(applicationService).withdrawApplication(9L);

        mockMvc.perform(delete("/api/applications/9"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(isEmptyString()));

        Mockito.verify(applicationService).withdrawApplication(9L);
        Mockito.verifyNoMoreInteractions(applicationService);
    }

@Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("DELETE /api/applications/{applicationId} should map IllegalArgumentException to 400 via GlobalExceptionHandler")
    void withdrawApplication_whenServiceThrowsIllegalArgument_mapsTo400() throws Exception {

        Mockito.doThrow(new IllegalArgumentException("Application not found"))
                .when(applicationService).withdrawApplication(9L);

        mockMvc.perform(delete("/api/applications/9"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Application not found")));

        Mockito.verify(applicationService).withdrawApplication(9L);
        Mockito.verifyNoMoreInteractions(applicationService);
    }

@Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("DELETE /api/applications/{applicationId} should map AccessDeniedException to 403 via GlobalExceptionHandler")

    void withdrawApplication_whenServiceThrowsAccessDenied_mapsTo403() throws Exception {
        Mockito.doThrow(new org.springframework.security.access.AccessDeniedException("Forbidden"))
                .when(applicationService).withdrawApplication(9L);

        mockMvc.perform(delete("/api/applications/9"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", containsString("Forbidden")));

        Mockito.verify(applicationService).withdrawApplication(9L);
        Mockito.verifyNoMoreInteractions(applicationService);
    }

@Test
    @WithMockUser(roles = "RECRUITER")
    @DisplayName("GET /api/applications should be rejected for non-STUDENT role (authorization enforced)")
    void myApplications_nonStudentRole_returns403() throws Exception {

        mockMvc.perform(get("/api/applications"))
                .andExpect(status().isForbidden());

        Mockito.verifyNoInteractions(applicationService);
    }
}

