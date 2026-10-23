package com.placement.service;

import com.placement.dto.ApplicationDTO;
import com.placement.entity.Application;
import com.placement.entity.Job;
import com.placement.entity.User;
import com.placement.repository.ApplicationRepository;
import com.placement.repository.JobRepository;
import com.placement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Regression tests for AUDIT-009: recruiter application status filtering is now
 * applied server-side (consistent with server-side pagination), instead of being
 * applied only client-side after fetching the entire current page.
 */
@ExtendWith(MockitoExtension.class)
class RecruiterApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MapperService mapperService;

    private RecruiterApplicationService service;

    private final String email = "recruiter@example.com";

    @BeforeEach
    void setUp() {
        service = new RecruiterApplicationService(applicationRepository, jobRepository, userRepository, mapperService);

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getName()).thenReturn(email);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    private User recruiter(Long id) {
        return User.builder().id(id).email(email).build();
    }

    @Test
    void listApplications_whenStatusProvided_filtersServerSide() {
        User recruiter = recruiter(1L);
        Job job = Job.builder().id(10L).recruiter(recruiter).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(recruiter));
        when(jobRepository.findByRecruiter_Id(recruiter.getId())).thenReturn(List.of(job));

        Application app = Application.builder().id(1L).status("SHORTLISTED").appliedAt(LocalDateTime.now()).job(job).build();
        Page<Application> appPage = new PageImpl<>(List.of(app));

        when(applicationRepository.findByJobInAndStatus(eq(List.of(job)), eq("SHORTLISTED"), any(Pageable.class)))
                .thenReturn(appPage);
        when(mapperService.applicationToDTO(app)).thenAnswer(invocation ->
                ApplicationDTO.builder().id(1L).status("SHORTLISTED").build());

        Page<ApplicationDTO> result = service.listApplications(0, 10, "appliedAt", "desc", null, "SHORTLISTED");

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("SHORTLISTED", result.getContent().get(0).getStatus());

        verify(applicationRepository).findByJobInAndStatus(eq(List.of(job)), eq("SHORTLISTED"), any(Pageable.class));
        verify(applicationRepository, never()).findByJobIn(anyList(), any(Pageable.class));
    }

    @Test
    void listApplications_whenStatusAndJobIdProvided_usesCombinedServerSideQuery() {
        User recruiter = recruiter(2L);
        Job job = Job.builder().id(20L).recruiter(recruiter).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(recruiter));
        when(jobRepository.findByRecruiter_Id(recruiter.getId())).thenReturn(List.of(job));

        Application app = Application.builder().id(2L).status("PENDING").appliedAt(LocalDateTime.now()).job(job).build();
        Page<Application> appPage = new PageImpl<>(List.of(app));

        when(applicationRepository.findByJobIdAndJobInAndStatus(eq(20L), eq(List.of(job)), eq("PENDING"), any(Pageable.class)))
                .thenReturn(appPage);
        when(mapperService.applicationToDTO(app)).thenAnswer(invocation ->
                ApplicationDTO.builder().id(2L).status("PENDING").build());

        Page<ApplicationDTO> result = service.listApplications(0, 10, "appliedAt", "desc", 20L, "pending");

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("PENDING", result.getContent().get(0).getStatus());

        verify(applicationRepository).findByJobIdAndJobInAndStatus(eq(20L), eq(List.of(job)), eq("PENDING"), any(Pageable.class));
    }

    @Test
    void listApplications_whenNoStatus_usesExistingQuery() {
        User recruiter = recruiter(3L);
        Job job = Job.builder().id(30L).recruiter(recruiter).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(recruiter));
        when(jobRepository.findByRecruiter_Id(recruiter.getId())).thenReturn(List.of(job));

        Application app = Application.builder().id(3L).status("SELECTED").appliedAt(LocalDateTime.now()).job(job).build();
        Page<Application> appPage = new PageImpl<>(List.of(app));

        when(applicationRepository.findByJobIn(eq(List.of(job)), any(Pageable.class))).thenReturn(appPage);
        when(mapperService.applicationToDTO(app)).thenAnswer(invocation ->
                ApplicationDTO.builder().id(3L).status("SELECTED").build());

        Page<ApplicationDTO> result = service.listApplications(0, 10, "appliedAt", "desc", null, null);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());

        verify(applicationRepository).findByJobIn(eq(List.of(job)), any(Pageable.class));
        verify(applicationRepository, never()).findByJobInAndStatus(anyList(), anyString(), any(Pageable.class));
    }

    @Test
    void listApplications_whenInvalidStatus_throws() {
        User recruiter = recruiter(4L);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(recruiter));

        assertThrows(IllegalArgumentException.class,
                () -> service.listApplications(0, 10, "appliedAt", "desc", null, "NOT_A_STATUS"));
    }
}
