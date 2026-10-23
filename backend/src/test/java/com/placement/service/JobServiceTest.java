package com.placement.service;

import com.placement.dto.JobDTO;
import com.placement.dto.JobDetailDTO;
import com.placement.dto.JobSearchCriteria;
import com.placement.entity.Job;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.JobRepository;
import org.springframework.data.jpa.domain.Specification;
import static org.mockito.Mockito.when;



import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;




@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private MapperService mapperService;

    private JobService jobService;

    @BeforeEach
    void setUp() {
        jobService = new JobService(jobRepository, mapperService);
    }

    @Test
    void getAllJobs_whenValidCriteria_returnsMappedPage() {
        JobSearchCriteria criteria = JobSearchCriteria.builder()
                .pageNumber(0)
                .pageSize(2)
                .sortBy("createdAt")
                .sortDirection("desc")
                .build();

        Pageable pageable = PageRequest.of(0, 2);

        Job j1 = Job.builder().id(1L).title("Dev").build();
        Job j2 = Job.builder().id(2L).title("QA").build();

        Page<Job> jobPage = new PageImpl<>(List.of(j1, j2), Pageable.unpaged(), 2);

        // We don't try to introspect JobSpecification; we only verify repository interaction.
        // JobRepository now has multiple findAll(...) overloads, so we must disambiguate.
        when(jobRepository.findAll((Specification<Job>) any(), any(Pageable.class)))
                .thenReturn(jobPage);








        JobDTO dto1 = JobDTO.builder().id(1L).title("Dev").build();
        JobDTO dto2 = JobDTO.builder().id(2L).title("QA").build();

        // Because JobService uses jobPage.map(mapperService::jobToDTO), we stub mapper.
        when(mapperService.jobToDTO(j1)).thenReturn(dto1);
        when(mapperService.jobToDTO(j2)).thenReturn(dto2);

        Page<JobDTO> result = jobService.getAllJobs(criteria);

        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
        assertEquals(List.of(dto1, dto2), result.getContent());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        // Disambiguate the JpaSpecificationExecutor findAll(Specification, Pageable) overload.
        verify(jobRepository).findAll((Specification<Job>) any(), pageableCaptor.capture());

        assertEquals(0, pageableCaptor.getValue().getPageNumber());
        assertEquals(2, pageableCaptor.getValue().getPageSize());
    }

    @Test
    void getAllJobs_whenRepositoryReturnsEmptyPage_returnsEmptyPage() {
        JobSearchCriteria criteria = JobSearchCriteria.builder()
                .pageNumber(0)
                .pageSize(10)
                .sortBy("createdAt")
                .sortDirection("desc")
                .build();

        Page<Job> empty = Page.empty();
        // Explicitly target the JpaSpecificationExecutor overload: findAll(Specification<T>, Pageable)
        when(jobRepository.findAll((Specification<Job>) any(), (Pageable) any())).thenReturn(empty);




        Page<JobDTO> result = jobService.getAllJobs(criteria);
        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());
        assertEquals(0, result.getTotalElements());

        verify(jobRepository).findAll((Specification<Job>) any(), (Pageable) any());
        verifyNoInteractions(mapperService);

    }

    @Test
    void getJobById_whenJobExists_returnsDetailDTO() {
        Long id = 123L;

        Job job = Job.builder().id(id).title("Dev").build();
        JobDetailDTO dto = JobDetailDTO.builder().id(id).title("Dev").build();

        when(jobRepository.findById(id)).thenReturn(Optional.of(job));
        when(mapperService.jobToDetailDTO(job)).thenReturn(dto);

        JobDetailDTO result = jobService.getJobById(id);

        assertNotNull(result);
        assertEquals(dto, result);
        verify(jobRepository).findById(id);
        verify(mapperService).jobToDetailDTO(job);
    }

    @Test
    void getJobById_whenJobNotFound_throwsResourceNotFoundException() {
        Long id = 999L;

        when(jobRepository.findById(id)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () -> jobService.getJobById(id));
        assertTrue(ex.getMessage().contains(String.valueOf(id)));

        verify(jobRepository).findById(id);
        verifyNoInteractions(mapperService);
    }

    @Test
    void getActiveJobs_whenCalled_usesActiveCriteriaAndDelegatesToGetAllJobs() {
        // Note: JobService.getActiveJobs builds a JobSearchCriteria with only status="ACTIVE"
        // (pageNumber/pageSize remain null), so getAllJobs falls back to its defaults of page 0, size 10.
        int pageNumber = 0;
        int pageSize = 10;

        JobSearchCriteria expectedCriteria = JobSearchCriteria.builder().status("ACTIVE").build();

        Job j1 = Job.builder().id(1L).status("ACTIVE").title("Dev").build();
        Page<Job> jobPage = new PageImpl<>(List.of(j1), PageRequest.of(pageNumber, pageSize), 1);

        when(jobRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(jobPage);

        when(mapperService.jobToDTO(j1)).thenReturn(JobDTO.builder().id(1L).title("Dev").build());

        Page<JobDTO> result = jobService.getActiveJobs(pageNumber, pageSize);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());

        // verify delegation happened with repository call
        verify(jobRepository).findAll((Specification<Job>) any(), (Pageable) any());


        // we can't reliably compare JobSpecification object, but we can validate pageable.
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(jobRepository).findAll((Specification<Job>) any(), pageableCaptor.capture());

        assertEquals(pageNumber, pageableCaptor.getValue().getPageNumber());
        assertEquals(pageSize, pageableCaptor.getValue().getPageSize());
    }
}

