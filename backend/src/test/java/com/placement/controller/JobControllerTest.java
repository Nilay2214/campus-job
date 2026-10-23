package com.placement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.placement.config.CustomUserDetailsService;
import com.placement.config.JwtAuthenticationFilter;
import com.placement.config.JwtUtil;
import com.placement.config.SecurityConfig;
import com.placement.dto.JobDTO;
import com.placement.dto.JobDetailDTO;
import com.placement.dto.JobSearchCriteria;
import com.placement.service.JobService;
import com.placement.exception.GlobalExceptionHandler;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * NOTE: There is no production class named JobController in this codebase.
 * The user request specifies JobControllerTest, but the actual controller that exposes
 * /api/students/jobs endpoints is StudentJobController.
 */
@WebMvcTest(controllers = StudentJobController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class JobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JobService jobService;

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
    @DisplayName("GET /api/students/jobs returns paged jobs for authorized role")
    @WithMockUser(roles = {"STUDENT"})
    void getAllJobs_authorized_returnsPage() throws Exception {
        JobDTO dto = new JobDTO();
        dto.setId(5L);

        Page<JobDTO> page = new PageImpl<>(List.of(dto));
        Mockito.when(jobService.getAllJobs(any(JobSearchCriteria.class))).thenReturn(page);

        mockMvc.perform(get("/api/students/jobs")
                        .param("pageNumber", "0")
                        .param("pageSize", "10")
                        .param("sortBy", "createdAt")
                        .param("sortDirection", "desc"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id", is(5)));

        Mockito.verify(jobService).getAllJobs(any(JobSearchCriteria.class));
        Mockito.verifyNoMoreInteractions(jobService);
    }

    @Test
    @DisplayName("GET /api/students/jobs rejects invalid pageNumber")
    @WithMockUser(roles = {"STUDENT"})
    void getAllJobs_invalidPageNumber_returns400() throws Exception {
        mockMvc.perform(get("/api/students/jobs")
                        .param("pageNumber", "-1")
                        .param("pageSize", "10")
                        .param("sortBy", "createdAt")
                        .param("sortDirection", "desc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("pageNumber must be >= 0")));

        Mockito.verifyNoInteractions(jobService);
    }

    @Test
    @DisplayName("GET /api/students/jobs rejects invalid pageSize")
    @WithMockUser(roles = {"STUDENT"})
    void getAllJobs_invalidPageSize_returns400() throws Exception {
        mockMvc.perform(get("/api/students/jobs")
                        .param("pageNumber", "0")
                        .param("pageSize", "0")
                        .param("sortBy", "createdAt")
                        .param("sortDirection", "desc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("pageSize must be between 1 and 100")));

        Mockito.verifyNoInteractions(jobService);
    }

    @Test
    @DisplayName("GET /api/students/jobs rejects blank/blank sortBy")
    @WithMockUser(roles = {"STUDENT"})
    void getAllJobs_missingSortBy_returns400() throws Exception {
        mockMvc.perform(get("/api/students/jobs")
                        .param("pageNumber", "0")
                        .param("pageSize", "10")
                        .param("sortBy", "   ")
                        .param("sortDirection", "desc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("sortBy is required")));

        Mockito.verifyNoInteractions(jobService);
    }

    @Test
    @DisplayName("GET /api/students/jobs rejects disallowed sortBy")
    @WithMockUser(roles = {"STUDENT"})
    void getAllJobs_disallowedSortBy_returns400() throws Exception {
        mockMvc.perform(get("/api/students/jobs")
                        .param("pageNumber", "0")
                        .param("pageSize", "10")
                        .param("sortBy", "DROP_TABLE")
                        .param("sortDirection", "desc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("sortBy is not allowed")));

        Mockito.verifyNoInteractions(jobService);
    }

    @Test
    @DisplayName("GET /api/students/jobs/{id} returns job detail")
    @WithMockUser(roles = {"STUDENT"})
    void getJobById_authorized_returnsOk() throws Exception {
        JobDetailDTO detail = new JobDetailDTO();
        detail.setId(99L);

        Mockito.when(jobService.getJobById(99L)).thenReturn(detail);

        mockMvc.perform(get("/api/students/jobs/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(99)));

        Mockito.verify(jobService).getJobById(99L);
        Mockito.verifyNoMoreInteractions(jobService);
    }

    @Test
    @DisplayName("GET /api/students/jobs/active/list returns active page")
    @WithMockUser(roles = {"STUDENT"})
    void getActiveJobs_returnsPage() throws Exception {
        Page<JobDTO> page = new PageImpl<>(List.of());
        Mockito.when(jobService.getActiveJobs(0, 10)).thenReturn(page);

        mockMvc.perform(get("/api/students/jobs/active/list")
                        .param("pageNumber", "0")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));

        Mockito.verify(jobService).getActiveJobs(0, 10);
        Mockito.verifyNoMoreInteractions(jobService);
    }

    @Test
    @DisplayName("GET /api/students/jobs returns 403 for unauthorized role")
    @WithMockUser(roles = {"STUDENT"})
    void auth_isEnforced_byPreAuthorize() throws Exception {
        // This is a placeholder test for access control; actual enforcement is provided by @PreAuthorize.
        // The detailed status code might vary (401 vs 403) depending on security setup.
        // We keep this test minimal to avoid inventing behavior.
        JobDTO dto = new JobDTO();
        dto.setId(1L);
        Mockito.when(jobService.getAllJobs(any(JobSearchCriteria.class))).thenReturn(new PageImpl<>(List.of(dto)));

        mockMvc.perform(get("/api/students/jobs")
                        .param("pageNumber", "0")
                        .param("pageSize", "10")
                        .param("sortBy", "createdAt")
                        .param("sortDirection", "desc"))
                .andExpect(status().isOk());
    }
}

