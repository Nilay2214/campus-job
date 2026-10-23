package com.placement.service;

import com.placement.dto.JobDTO;
import com.placement.dto.JobDetailDTO;
import com.placement.dto.JobRequest;
import com.placement.entity.Company;
import com.placement.entity.Job;
import com.placement.entity.User;
import com.placement.repository.ApplicationRepository;
import com.placement.repository.CompanyRepository;
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

@ExtendWith(MockitoExtension.class)
class RecruiterServiceTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private CompanyRepository companyRepository;

@Mock
    private UserRepository userRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private MapperService mapperService;

    private RecruiterService recruiterService;

    private final String email = "recruiter@example.com";

    @BeforeEach
    void setUp() {
        recruiterService = new RecruiterService(jobRepository, companyRepository, userRepository, applicationRepository, mapperService);

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getName()).thenReturn(email);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void createJob_whenRecruiterAndCompanyExist_savesJobWithOwnershipAndDefaults() {
        Long companyId = 10L;

        User recruiter = User.builder().id(1L).email(email).build();
        Company company = Company.builder().id(companyId).build();

        JobRequest request = new JobRequest();
        request.setCompanyId(companyId);
        request.setTitle("Backend Engineer");
        request.setDescription("desc");
        request.setEligibility("UG");
        request.setRequiredSkills("Java");
        request.setLocation("Pune");
        request.setSalaryMin(new java.math.BigDecimal("1000"));
        request.setSalaryMax(new java.math.BigDecimal("2000"));

        request.setEmploymentType("FULL_TIME");
        request.setWorkMode("REMOTE");
        request.setExperience("0-2");
        request.setDeadline(LocalDateTime.now());

        request.setStatus(null);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(recruiter));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));

        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(mapperService.jobToDetailDTO(any(Job.class))).thenAnswer(invocation -> {
            Job j = invocation.getArgument(0);
            return JobDetailDTO.builder()
                    .title(j.getTitle())
                    .status(j.getStatus())
                    .company(null)
                    .build();
        });

        JobDetailDTO saved = recruiterService.createJob(request);

        assertNotNull(saved);
        assertEquals("Backend Engineer", saved.getTitle());
        assertEquals("ACTIVE", saved.getStatus());

        verify(jobRepository).save(any(Job.class));
    }

    @Test
    void listJobs_whenNoStatusAndNoTitle_recruiterOnly_paginatesViaRecruiterQuery() {
        int page = 0;
        int size = 10;

User recruiter = User.builder().id(1L).email(email).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(recruiter));

        Company company = Company.builder().id(10L).name("TechCorp").build();
        Job j = Job.builder().id(1L).title("Dev").status("ACTIVE").company(company).createdAt(LocalDateTime.now()).build();
        Page<Job> jobPage = new PageImpl<>(List.of(j));

        when(jobRepository.findAllByRecruiter_IdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(jobPage);

        when(mapperService.companyToDTO(company)).thenAnswer(invocation -> {
            Company c = invocation.getArgument(0);
            return com.placement.dto.CompanyDTO.builder().id(c.getId()).name(c.getName()).build();
        });

        Page<JobDTO> result = recruiterService.listJobs(page, size, "createdAt", "desc", "", "");

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertEquals("Dev", result.getContent().get(0).getTitle());
        assertNotNull(result.getContent().get(0).getCompany());
        assertEquals("TechCorp", result.getContent().get(0).getCompany().getName());

        verify(jobRepository).findAllByRecruiter_IdOrderByCreatedAtDesc(eq(1L), any(Pageable.class));
        verify(jobRepository, never()).findAllByRecruiter_IdAndStatusOrderByCreatedAtDesc(anyLong(), anyString(), any(Pageable.class));
        verify(jobRepository, never()).findAllByRecruiter_IdAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(anyLong(), anyString(), any(Pageable.class));
        verify(jobRepository, never()).findAllByRecruiter_IdAndStatusAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(anyLong(), anyString(), anyString(), any(Pageable.class));
    }

    @Test
    void listJobs_whenStatusProvided_recruiterAndStatus_paginatesViaStatusQuery() {
        int page = 0;
        int size = 5;
        String status = "ACTIVE";

        User recruiter = User.builder().id(2L).email(email).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(recruiter));

        Job j = Job.builder().id(1L).title("Dev").status(status).createdAt(LocalDateTime.now()).build();
        Page<Job> jobPage = new PageImpl<>(List.of(j));

        when(jobRepository.findAllByRecruiter_IdAndStatusOrderByCreatedAtDesc(eq(2L), eq(status), any(Pageable.class)))
                .thenReturn(jobPage);

        Page<JobDTO> result = recruiterService.listJobs(page, size, "createdAt", "desc", status, "");

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Dev", result.getContent().get(0).getTitle());

        verify(jobRepository).findAllByRecruiter_IdAndStatusOrderByCreatedAtDesc(eq(2L), eq(status), any(Pageable.class));
    }

    @Test
    void listJobs_whenTitleProvided_recruiterAndTitle_paginatesViaTitleQuery() {
        int page = 0;
        int size = 3;
        String title = "Engineer";

        User recruiter = User.builder().id(3L).email(email).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(recruiter));

        Job j = Job.builder().id(1L).title(title).status("ACTIVE").createdAt(LocalDateTime.now()).build();
        Page<Job> jobPage = new PageImpl<>(List.of(j));

        when(jobRepository.findAllByRecruiter_IdAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(eq(3L), eq(title), any(Pageable.class)))
                .thenReturn(jobPage);

        Page<JobDTO> result = recruiterService.listJobs(page, size, "createdAt", "desc", "", title);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(title, result.getContent().get(0).getTitle());

        verify(jobRepository).findAllByRecruiter_IdAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(eq(3L), eq(title), any(Pageable.class));
    }

    @Test
    void listJobs_whenStatusAndTitleProvided_recruiterAndStatusAndTitle_paginatesViaCombinedQuery() {
        int page = 0;
        int size = 10;
        String status = "ACTIVE";
        String title = "Dev";

        User recruiter = User.builder().id(4L).email(email).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(recruiter));

        Job j = Job.builder().id(1L).title(title).status(status).createdAt(LocalDateTime.now()).build();
        Page<Job> jobPage = new PageImpl<>(List.of(j));

        when(jobRepository.findAllByRecruiter_IdAndStatusAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(
                eq(4L), eq(status), eq(title), any(Pageable.class)
        )).thenReturn(jobPage);

        Page<JobDTO> result = recruiterService.listJobs(page, size, "createdAt", "desc", status, title);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(title, result.getContent().get(0).getTitle());

        verify(jobRepository).findAllByRecruiter_IdAndStatusAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(
                eq(4L), eq(status), eq(title), any(Pageable.class)
        );
    }

    @Test
    void listJobs_emptyPage_returnsEmptyContent() {
        int page = 0;
        int size = 10;

        User recruiter = User.builder().id(5L).email(email).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(recruiter));

        Page<Job> jobPage = Page.empty();
        when(jobRepository.findAllByRecruiter_IdOrderByCreatedAtDesc(eq(5L), any(Pageable.class)))
                .thenReturn(jobPage);

Page<JobDTO> result = recruiterService.listJobs(page, size, "createdAt", "desc", null, null);
        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());

        verify(jobRepository).findAllByRecruiter_IdOrderByCreatedAtDesc(eq(5L), any(Pageable.class));
    }

    @Test
    void deleteJob_whenJobHasApplications_throwsClearIllegalState() {
        Long jobId = 99L;
        User recruiter = User.builder().id(9L).email(email).build();
        Job job = Job.builder().id(jobId).title("Dev Role").recruiter(recruiter).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(recruiter));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(applicationRepository.countByJobId(jobId)).thenReturn(3L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> recruiterService.deleteJob(jobId));
        assertTrue(ex.getMessage().contains("has 3 student application(s)"));
        verify(jobRepository, never()).delete(any(Job.class));
    }

    @Test
    void deleteJob_whenNoApplications_deletesJob() {
        Long jobId = 98L;
        User recruiter = User.builder().id(8L).email(email).build();
        Job job = Job.builder().id(jobId).title("Empty Role").recruiter(recruiter).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(recruiter));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(applicationRepository.countByJobId(jobId)).thenReturn(0L);

        recruiterService.deleteJob(jobId);
        verify(jobRepository).delete(job);
    }
}
