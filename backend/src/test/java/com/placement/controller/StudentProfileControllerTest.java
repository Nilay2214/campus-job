package com.placement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.placement.config.CustomUserDetailsService;
import com.placement.config.JwtAuthenticationFilter;
import com.placement.config.JwtUtil;
import com.placement.config.SecurityConfig;
import com.placement.dto.StudentProfileRequest;
import com.placement.entity.StudentProfile;
import com.placement.exception.GlobalExceptionHandler;
import com.placement.service.StudentService;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = StudentProfileController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class StudentProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private StudentService studentService;

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
    @DisplayName("POST /api/students/profile returns 200 with saved profile for STUDENT")
    void saveProfile_whenStudent_returnsProfile() throws Exception {
        StudentProfileRequest req = new StudentProfileRequest();
        // keep payload minimal; controller delegates to service.

        StudentProfile profile = StudentProfile.builder()
                .id(1L)
                .build();

        Mockito.when(studentService.saveOrUpdateProfile(any(StudentProfileRequest.class))).thenReturn(profile);

        mockMvc.perform(post("/api/students/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(1)));

        Mockito.verify(studentService).saveOrUpdateProfile(any(StudentProfileRequest.class));
        Mockito.verifyNoMoreInteractions(studentService);
    }

@Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("POST /api/students/profile delegates service and preserves IllegalArgumentException mapping to 400")
    void saveProfile_whenServiceThrowsIllegalArgument_mapsTo400() throws Exception {
        StudentProfileRequest req = new StudentProfileRequest();

        Mockito.when(studentService.saveOrUpdateProfile(any(StudentProfileRequest.class)))
                .thenThrow(new IllegalArgumentException("Invalid profile"));

        mockMvc.perform(post("/api/students/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error", containsString("Invalid profile")));

        Mockito.verify(studentService).saveOrUpdateProfile(any(StudentProfileRequest.class));
        Mockito.verifyNoMoreInteractions(studentService);
    }

@Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("GET /api/students/profile returns 200 and profile")
    void getProfile_returnsProfile() throws Exception {
        StudentProfile profile = StudentProfile.builder()
                .id(7L)
                .build();

        Mockito.when(studentService.getProfile()).thenReturn(profile);

        mockMvc.perform(get("/api/students/profile"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(7)));

        Mockito.verify(studentService).getProfile();
        Mockito.verifyNoMoreInteractions(studentService);
    }

@Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("POST /api/students/profile/resume rejects when resume part is missing")
    void uploadResume_whenResumeMissing_returns400() throws Exception {
        // resume required=false, controller throws IllegalArgumentException when null.
        // Send a multipart POST with no "resume" part to simulate the missing file.
        mockMvc.perform(multipart("/api/students/profile/resume"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error", containsString("Resume file is required")));

        Mockito.verifyNoInteractions(studentService);
    }

@Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("POST /api/students/profile/resume rejects empty resume file")
    void uploadResume_whenResumeEmpty_returns400() throws Exception {
        MockMultipartFile emptyPdf = new MockMultipartFile(
                "resume",
                "resume.pdf",
                "application/pdf",
                new byte[0]);

        mockMvc.perform(multipart("/api/students/profile/resume").file(emptyPdf)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error", containsString("must not be empty")));

        Mockito.verifyNoInteractions(studentService);
    }

@Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("POST /api/students/profile/resume rejects non-PDF content type")
    void uploadResume_whenContentTypeNotPdf_returns400() throws Exception {
        MockMultipartFile txtFile = new MockMultipartFile(
                "resume",
                "resume.txt",
                "text/plain",
                "hello".getBytes());

        mockMvc.perform(multipart("/api/students/profile/resume").file(txtFile)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error", containsString("must be a PDF")));

        Mockito.verifyNoInteractions(studentService);
    }

@Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("POST /api/students/profile/resume returns success message and delegates upload")
    void uploadResume_whenValidPdf_uploadsAndReturnsMessage() throws Exception {
        MockMultipartFile pdf = new MockMultipartFile(
                "resume",
                "resume.pdf",
                "application/pdf",
                new byte[]{1, 2, 3});

Mockito.when(studentService.uploadResume(eq(pdf))).thenReturn("/uploads/resumes/resume.pdf");

        mockMvc.perform(multipart("/api/students/profile/resume").file(pdf)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
.andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("Resume uploaded successfully")));

        Mockito.verify(studentService).uploadResume(eq(pdf));
        Mockito.verifyNoMoreInteractions(studentService);
    }
}

