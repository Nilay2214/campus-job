package com.placement.service;

import com.placement.dto.JobDTO;
import com.placement.dto.JobDetailDTO;
import com.placement.dto.JobSearchCriteria;
import com.placement.entity.Job;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.JobRepository;
import com.placement.specification.JobSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final JobRepository jobRepository;
    private final MapperService mapperService;

    /**
     * Get all jobs with pagination, sorting, and filtering
     */
    public Page<JobDTO> getAllJobs(JobSearchCriteria criteria) {
        log.info("Fetching jobs with criteria: {}", criteria);

        // Default pagination and sorting
        int pageNumber = criteria.getPageNumber() != null ? criteria.getPageNumber() : 0;
        int pageSize = criteria.getPageSize() != null ? criteria.getPageSize() : 10;
        String sortBy = criteria.getSortBy() != null ? criteria.getSortBy() : "createdAt";
        Sort.Direction direction = "desc".equalsIgnoreCase(criteria.getSortDirection()) 
            ? Sort.Direction.DESC 
            : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(direction, sortBy));

        Page<Job> jobPage = jobRepository.findAll(
            JobSpecification.getJobsByCriteria(criteria),
            pageable
        );

        log.info("Found {} jobs", jobPage.getTotalElements());
        return jobPage.map(mapperService::jobToDTO);
    }

/**
     * Get job by ID (student-facing detail).
     *
     * <p>A job is only returned to a student when it is still available:
     * status == ACTIVE AND (deadline IS NULL OR deadline >= now). This mirrors
     * the listing filter in {@link JobSpecification} so a job that is no longer
     * on the list cannot be pulled up by direct id and the "Apply" flow exposed.
     * Recruiter/admins manage jobs through their own dedicated endpoints, so this
     * restriction does not affect recruiter or admin job management.</p>
     */
    public JobDetailDTO getJobById(Long id) {
        log.info("Fetching job with id: {}", id);

        Job job = jobRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Job not found with id: {}", id);
                return new ResourceNotFoundException("Job not found with id: " + id);
            });

        boolean active = "ACTIVE".equalsIgnoreCase(job.getStatus());
        boolean notExpired = job.getDeadline() == null || !job.getDeadline().isBefore(LocalDateTime.now());
        if (!active || !notExpired) {
            throw new ResourceNotFoundException("Job not found with id: " + id);
        }

        return mapperService.jobToDetailDTO(job);
    }

    /**
     * Get all active jobs (for students)
     */
    public Page<JobDTO> getActiveJobs(int pageNumber, int pageSize) {
        log.info("Fetching active jobs - page: {}, size: {}", pageNumber, pageSize);

JobSearchCriteria criteria = JobSearchCriteria.builder()
            .status("ACTIVE")
            .pageNumber(pageNumber)
            .pageSize(pageSize)
            .sortBy("createdAt")
            .sortDirection("desc")
            .build();

        return getAllJobs(criteria);
    }
}
