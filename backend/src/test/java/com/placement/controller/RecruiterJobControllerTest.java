package com.placement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.placement.config.CustomUserDetailsService;
import com.placement.config.JwtAuthenticationFilter;
import com.placement.config.JwtUtil;
import com.placement.config.SecurityConfig;
import com.placement.dto.JobDTO;
import com.placement.dto.JobDetailDTO;
import com.placement.dto.JobRequest;
import com.placement.exception.GlobalExceptionHandler;
import com.placement.service.RecruiterService;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = RecruiterJobController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class RecruiterJobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RecruiterService recruiterService;

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
    @DisplayName("POST /api/recruiters/jobs returns created job for authenticated RECRUITER")
    @WithMockUser(roles = "RECRUITER")
    void createJob_authenticatedRecruiter_returnsOk() throws Exception {
        // JobRequest has @NotBlank/@NotNull validation constraints, so the payload must be
        // fully populated to pass @Valid on the controller. An empty request would return 400.
        JobRequest request = JobRequest.builder()
                .title("Software Engineer")
                .description("Build scalable systems")
                .location("Bangalore")
                .employmentType("FULL_TIME")
                .workMode("HYBRID")
                .salaryMin(new java.math.BigDecimal("800000"))
                .salaryMax(new java.math.BigDecimal("1500000"))
                .deadline(java.time.LocalDateTime.now().plusDays(30))
                .companyId(1L)
                .status("ACTIVE")
                .build();

// Service returns JobDetailDTO; assert only status/body presence.
        JobDetailDTO job = JobDetailDTO.builder()
                .id(1L)
                .title("Software Engineer")
                .build();

        Mockito.when(recruiterService.createJob(any(JobRequest.class))).thenReturn(job);

        mockMvc.perform(post("/api/recruiters/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(1)));

        Mockito.verify(recruiterService).createJob(any(JobRequest.class));
        Mockito.verifyNoMoreInteractions(recruiterService);
    }

@Test
    @DisplayName("POST /api/recruiters/jobs unauthenticated returns 401")
    void createJob_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/recruiters/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new JobRequest())))
                .andExpect(status().isUnauthorized());

        Mockito.verifyNoInteractions(recruiterService);
    }

    @Test
    @DisplayName("GET /api/recruiters/jobs returns paged jobs for authenticated RECRUITER")
    @WithMockUser(roles = "RECRUITER")
    void listJobs_authenticatedRecruiter_returnsPage() throws Exception {
        JobDTO dto = new JobDTO();
        dto.setId(10L);
        dto.setTitle("Backend Developer");

        Page<JobDTO> page = new PageImpl<>(List.of(dto));
        Mockito.when(recruiterService.listJobs(eq(0), eq(10), eq("createdAt"), eq("desc"), eq(null), eq(null)))
                .thenReturn(page);

        mockMvc.perform(get("/api/recruiters/jobs")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "createdAt")
                        .param("direction", "desc"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id", is(10)));

        Mockito.verify(recruiterService).listJobs(eq(0), eq(10), eq("createdAt"), eq("desc"), eq(null), eq(null));
        Mockito.verifyNoMoreInteractions(recruiterService);
    }

@Test
    @DisplayName("GET /api/recruiters/jobs unauthenticated returns 401")
    void listJobs_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/recruiters/jobs")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isUnauthorized());

        Mockito.verifyNoInteractions(recruiterService);
    }

    @Test
    @DisplayName("GET /api/recruiters/jobs returns empty page when service returns empty")
    @WithMockUser(roles = "RECRUITER")
    void listJobs_returnsEmptyPage() throws Exception {
        Page<JobDTO> page = new PageImpl<>(List.of());

        Mockito.when(recruiterService.listJobs(eq(0), eq(10), eq("createdAt"), eq("desc"), eq("ACTIVE"), eq("")))
                .thenReturn(page);

        mockMvc.perform(get("/api/recruiters/jobs")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "createdAt")
                        .param("direction", "desc")
                        .param("status", "ACTIVE")
                        .param("title", ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));

        Mockito.verify(recruiterService).listJobs(eq(0), eq(10), eq("createdAt"), eq("desc"), eq("ACTIVE"), eq(""));
        Mockito.verifyNoMoreInteractions(recruiterService);
    }
}

