package com.placement.service;

import com.placement.dto.ApplicationDTO;
import com.placement.dto.ApplicationStatusRequest;
import com.placement.entity.Application;
import com.placement.entity.Job;
import com.placement.entity.User;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.ApplicationRepository;
import com.placement.repository.JobRepository;
import com.placement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Recruiter-facing application review endpoints.
 * Only applications against jobs owned by the authenticated recruiter are visible.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class RecruiterApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final com.placement.service.MapperService mapperService;

    private User getCurrentRecruiter() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

private List<Job> getOwnedJobs(User recruiter) {
        // DB-scoped query (returns only this recruiter's jobs) instead of loading ALL
        // jobs into memory and filtering in Java. Avoids a full-table scan / N+1 pattern.
        return jobRepository.findByRecruiter_Id(recruiter.getId());
    }

/**
     * List applications across all jobs owned by the recruiter.
     *
     * @param status optional status filter (PENDING, SHORTLISTED, SELECTED, REJECTED) applied server-side
     *               so filtering stays consistent with server-side pagination.
     */
    public Page<ApplicationDTO> listApplications(int page, int size, String sortBy, String direction, Long jobId, String status) {
        User recruiter = getCurrentRecruiter();
        List<Job> ownedJobs = getOwnedJobs(recruiter);

        int safePage = Math.max(page, 0);
        int safeSize = (size <= 0 || size > 100) ? 10 : size;
        String effectiveSortBy = (sortBy == null || sortBy.isBlank()) ? "appliedAt" : sortBy;
        Sort.Direction effectiveDir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(effectiveDir, effectiveSortBy));

        String normalizedStatus = status == null || status.isBlank() ? null : status.trim().toUpperCase();
        if (normalizedStatus != null
                && !normalizedStatus.equals("PENDING") && !normalizedStatus.equals("SHORTLISTED")
                && !normalizedStatus.equals("SELECTED") && !normalizedStatus.equals("REJECTED")) {
            throw new IllegalArgumentException("Invalid application status: " + normalizedStatus);
        }

        Page<Application> appPage;
        if (jobId != null && normalizedStatus != null) {
            appPage = applicationRepository.findByJobIdAndJobInAndStatus(jobId, ownedJobs, normalizedStatus, pageable);
        } else if (jobId != null) {
            appPage = applicationRepository.findByJobIdAndJobIn(jobId, ownedJobs, pageable);
        } else if (normalizedStatus != null) {
            appPage = applicationRepository.findByJobInAndStatus(ownedJobs, normalizedStatus, pageable);
        } else {
            appPage = applicationRepository.findByJobIn(ownedJobs, pageable);
        }

        return appPage.map(mapperService::applicationToDTO);
    }

    /**
     * Update the status of an application for a job owned by the recruiter.
     */
    public ApplicationDTO updateStatus(Long applicationId, ApplicationStatusRequest request) {
        String newStatus = request.getStatus() == null ? null : request.getStatus().trim().toUpperCase();
        if (newStatus == null || newStatus.isBlank()) {
            throw new IllegalArgumentException("status is required");
        }
        if (!newStatus.equals("PENDING") && !newStatus.equals("SHORTLISTED")
                && !newStatus.equals("SELECTED") && !newStatus.equals("REJECTED")) {
            throw new IllegalArgumentException("Invalid application status: " + newStatus);
        }

        User recruiter = getCurrentRecruiter();
        List<Long> ownedJobIds = getOwnedJobs(recruiter).stream()
                .map(Job::getId)
                .collect(Collectors.toList());

        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + applicationId));

        if (application.getJob() == null || !ownedJobIds.contains(application.getJob().getId())) {
            throw new ResourceNotFoundException("Application not found or not for a job you own");
        }

        application.setStatus(newStatus);
        return mapperService.applicationToDTO(applicationRepository.save(application));
    }
}
