package com.placement.service;

import com.placement.dto.ApplicationDTO;
import com.placement.entity.Application;
import com.placement.entity.Job;
import com.placement.entity.StudentProfile;
import com.placement.entity.User;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.ApplicationRepository;
import com.placement.repository.JobRepository;
import com.placement.repository.StudentProfileRepository;
import com.placement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private StudentProfileRepository studentProfileRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MapperService mapperService;

    private ApplicationService applicationService;

    private final String email = "student@example.com";

    @BeforeEach
    void setUp() {
        applicationService = new ApplicationService(applicationRepository, studentProfileRepository, jobRepository, userRepository, mapperService);

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn(email);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

@Test
    void applyToJob_whenJobExistsAndActiveAndNotDuplicate_createsPendingApplication() {
        Long jobId = 10L;

User user = User.builder().email(email).build();
        StudentProfile student = StudentProfile.builder().id(5L).user(user).build();

        Job job = Job.builder()
                .id(jobId)
                .status("ACTIVE")
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(applicationRepository.existsByStudentIdAndJobId(5L, jobId)).thenReturn(false);

        ArgumentCaptor<Application> applicationCaptor = ArgumentCaptor.forClass(Application.class);
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(mapperService.applicationToDTO(any(Application.class))).thenAnswer(invocation -> ApplicationDTO.builder().build());

        ApplicationDTO result = applicationService.applyToJob(jobId);

        verify(applicationRepository).save(applicationCaptor.capture());
        Application saved = applicationCaptor.getValue();

        assertNotNull(result);
        assertEquals("PENDING", saved.getStatus());
        assertEquals(student, saved.getStudent());
        assertEquals(job, saved.getJob());
        assertNotNull(saved.getAppliedAt());

        verify(applicationRepository).existsByStudentIdAndJobId(anyLong(), eq(jobId));
        verify(jobRepository).findById(jobId);
    }

    @Test
    void applyToJob_whenActiveButDeadlineInPast_throwsIllegalArgumentException() {
        Long jobId = 20L;

        User user = User.builder().email(email).build();
        StudentProfile student = StudentProfile.builder().id(5L).user(user).build();

        Job job = Job.builder()
                .id(jobId)
                .status("ACTIVE")
                .deadline(LocalDateTime.now().minusDays(1))
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> applicationService.applyToJob(jobId));
        assertTrue(ex.getMessage().contains("deadline has passed"));

        verify(applicationRepository, never()).save(any());
    }

    @Test
    void applyToJob_whenActiveAndFutureDeadline_createsApplication() {
        Long jobId = 21L;

        User user = User.builder().email(email).build();
        StudentProfile student = StudentProfile.builder().id(5L).user(user).build();

        Job job = Job.builder()
                .id(jobId)
                .status("ACTIVE")
                .deadline(LocalDateTime.now().plusDays(10))
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(applicationRepository.existsByStudentIdAndJobId(5L, jobId)).thenReturn(false);
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(mapperService.applicationToDTO(any(Application.class))).thenAnswer(invocation -> ApplicationDTO.builder().build());

        ApplicationDTO result = applicationService.applyToJob(jobId);

        assertNotNull(result);
        verify(applicationRepository).save(any(Application.class));
    }

    @Test
    void applyToJob_whenConcurrentDuplicateCausesIntegrityViolation_returnsCleanDuplicateMessage() {
        Long jobId = 30L;

        User user = User.builder().email(email).build();
        StudentProfile student = StudentProfile.builder().id(5L).user(user).build();

        Job job = Job.builder()
                .id(jobId)
                .status("ACTIVE")
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(applicationRepository.existsByStudentIdAndJobId(5L, jobId)).thenReturn(false);
        when(applicationRepository.save(any(Application.class)))
                .thenThrow(new org.springframework.dao.DataIntegrityViolationException("dup"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> applicationService.applyToJob(jobId));
        assertTrue(ex.getMessage().contains("already exists"));
    }

    @Test
    void applyToJob_whenJobNotFound_throwsResourceNotFoundException() {
        Long jobId = 10L;

        User user = User.builder().email(email).build();
        StudentProfile student = StudentProfile.builder().user(user).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(jobRepository.findById(jobId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> applicationService.applyToJob(jobId));

        verify(applicationRepository, never()).save(any());
    }

    @Test
    void applyToJob_whenJobNotActive_throwsIllegalArgumentException() {
        Long jobId = 10L;

        User user = User.builder().email(email).build();
        StudentProfile student = StudentProfile.builder().user(user).build();

        Job job = Job.builder()
                .id(jobId)
                .status("CLOSED")
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

        assertThrows(IllegalArgumentException.class, () -> applicationService.applyToJob(jobId));

        verify(applicationRepository, never()).save(any());
    }

@Test
    void applyToJob_whenDuplicateApplicationExists_throwsIllegalArgumentException() {
        Long jobId = 10L;

        User user = User.builder().email(email).build();
        StudentProfile student = StudentProfile.builder().id(7L).user(user).build();

        Job job = Job.builder()
                .id(jobId)
                .status("ACTIVE")
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(applicationRepository.existsByStudentIdAndJobId(7L, jobId)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> applicationService.applyToJob(jobId));

        verify(applicationRepository, never()).save(any());
    }

    @Test
    void getMyApplications_whenApplicationsExist_returnsStudentApplications() {
        User user = User.builder().email(email).build();
        StudentProfile student = StudentProfile.builder().user(user).build();

        Application a1 = Application.builder().student(student).build();
        Application a2 = Application.builder().student(student).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(applicationRepository.findByStudent(student)).thenReturn(List.of(a1, a2));
        when(mapperService.applicationToDTO(any(Application.class))).thenAnswer(invocation -> ApplicationDTO.builder().build());

        List<ApplicationDTO> result = applicationService.getMyApplications();

        assertEquals(2, result.size());

        verify(applicationRepository).findByStudent(student);
    }

    @Test
    void getMyApplications_whenNoApplications_returnsEmptyList() {
        User user = User.builder().email(email).build();
        StudentProfile student = StudentProfile.builder().user(user).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(applicationRepository.findByStudent(student)).thenReturn(List.of());

        List<ApplicationDTO> result = applicationService.getMyApplications();

        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(applicationRepository).findByStudent(student);
    }

    @Test
    void withdrawApplication_whenOwnedAndPending_deletesApplication() {
        Long applicationId = 100L;
        Long studentId = 1L;

        User user = User.builder().email(email).build();
        StudentProfile student = StudentProfile.builder().id(studentId).user(user).build();

        Application application = Application.builder()
                .id(applicationId)
                .student(student)
                .status("PENDING")
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

        assertDoesNotThrow(() -> applicationService.withdrawApplication(applicationId));

        verify(applicationRepository).delete(application);
    }

    @Test
    void withdrawApplication_whenApplicationNotFound_throwsResourceNotFoundException() {
        Long applicationId = 100L;

        User user = User.builder().email(email).build();
        StudentProfile student = StudentProfile.builder().user(user).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> applicationService.withdrawApplication(applicationId));

        verify(applicationRepository, never()).delete(any());
    }

    @Test
    void withdrawApplication_whenOwnedStudentMismatch_throwsAccessDenied() {
        Long applicationId = 100L;

        User user = User.builder().email(email).build();
        StudentProfile authenticatedStudent = StudentProfile.builder().id(1L).user(user).build();

        StudentProfile otherStudent = StudentProfile.builder().id(2L).build();

        Application application = Application.builder()
                .id(applicationId)
                .student(otherStudent)
                .status("PENDING")
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(authenticatedStudent));
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

        assertThrows(AccessDeniedException.class, () -> applicationService.withdrawApplication(applicationId));

        verify(applicationRepository, never()).delete(any());
    }

    @Test
    void withdrawApplication_whenStatusNotPending_throwsIllegalStateException() {
        Long applicationId = 100L;

        User user = User.builder().email(email).build();
        StudentProfile student = StudentProfile.builder().id(1L).user(user).build();

        Application application = Application.builder()
                .id(applicationId)
                .student(student)
                .status("APPROVED")
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

        assertThrows(IllegalStateException.class, () -> applicationService.withdrawApplication(applicationId));

        verify(applicationRepository, never()).delete(any());
    }
}
