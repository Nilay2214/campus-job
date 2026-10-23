package com.placement.service;

import com.placement.dto.JobDTO;
import com.placement.dto.JobDetailDTO;
import com.placement.dto.JobRequest;
import com.placement.entity.Company;
import com.placement.entity.Job;
import com.placement.entity.User;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.ApplicationRepository;
import com.placement.repository.CompanyRepository;
import com.placement.repository.JobRepository;
import com.placement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class RecruiterService {

private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final com.placement.service.MapperService mapperService;

    private User getCurrentRecruiter() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Job findOwnedJob(Long jobId, User recruiter) {
        return jobRepository.findById(jobId)
                .filter(job -> job.getRecruiter() != null && Objects.equals(job.getRecruiter().getId(), recruiter.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Job not found or not owned by you"));
    }

    /**
     * This service is currently responsible for recruiter job creation.
     */
    public JobDetailDTO createJob(JobRequest request) {
        User recruiter = getCurrentRecruiter();
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        Job job = Job.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .eligibility(request.getEligibility())
                .requiredSkills(request.getRequiredSkills())
                .location(request.getLocation())
                .salaryMin(request.getSalaryMin())
                .salaryMax(request.getSalaryMax())
                .employmentType(request.getEmploymentType())
                .workMode(request.getWorkMode())
                .experience(request.getExperience())
                .deadline(request.getDeadline())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .createdAt(LocalDateTime.now())
                .company(company)
                .recruiter(recruiter)
                .build();

        return mapperService.jobToDetailDTO(jobRepository.save(job));
    }

    public JobDetailDTO getJob(Long jobId) {
        User recruiter = getCurrentRecruiter();
        return mapperService.jobToDetailDTO(findOwnedJob(jobId, recruiter));
    }

    public JobDetailDTO updateJob(Long jobId, JobRequest request) {
        User recruiter = getCurrentRecruiter();
        Job job = findOwnedJob(jobId, recruiter);

        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setEligibility(request.getEligibility());
        job.setRequiredSkills(request.getRequiredSkills());
        job.setLocation(request.getLocation());
        job.setSalaryMin(request.getSalaryMin());
        job.setSalaryMax(request.getSalaryMax());
        job.setEmploymentType(request.getEmploymentType());
        job.setWorkMode(request.getWorkMode());
        job.setExperience(request.getExperience());
        job.setDeadline(request.getDeadline());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            job.setStatus(request.getStatus());
        }

        return mapperService.jobToDetailDTO(jobRepository.save(job));
    }

public void deleteJob(Long jobId) {
        User recruiter = getCurrentRecruiter();
        Job job = findOwnedJob(jobId, recruiter);
        long applicationCount = applicationRepository.countByJobId(job.getId());
        if (applicationCount > 0) {
            throw new IllegalStateException(
                    "Cannot delete job '" + job.getTitle() + "' because it has " + applicationCount
                            + " student application(s). Close the job instead to stop new applications.");
        }
        jobRepository.delete(job);
    }

    /**
     * Pagination contract for the frontend recruiter jobs page.
     */
    public Page<JobDTO> listJobs(int page, int size, String sortBy, String direction, String status, String title) {
        // Validate basic pagination constraints
        int safePage = Math.max(page, 0);
        int safeSize = (size <= 0 || size > 100) ? 10 : size;

        // Whitelist sortable columns
        String effectiveSortBy = (sortBy == null || sortBy.isBlank()) ? "createdAt" : sortBy;
        if (!effectiveSortBy.equals("createdAt") && !effectiveSortBy.equals("deadline") && !effectiveSortBy.equals("salaryMin") && !effectiveSortBy.equals("salaryMax") && !effectiveSortBy.equals("title")) {
            effectiveSortBy = "createdAt";
        }

        Sort.Direction effectiveDir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(effectiveDir, effectiveSortBy));

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User recruiter = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Long recruiterId = recruiter.getId();

        boolean hasStatus = status != null && !status.isBlank();
        boolean hasTitle = title != null && !title.isBlank();

        Page<Job> jobPage;
        if (hasStatus && hasTitle) {
            jobPage = jobRepository.findAllByRecruiter_IdAndStatusAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(
                    recruiterId,
                    status,
                    title,
                    pageable
            );
        } else if (hasStatus) {
            jobPage = jobRepository.findAllByRecruiter_IdAndStatusOrderByCreatedAtDesc(
                    recruiterId,
                    status,
                    pageable
            );
        } else if (hasTitle) {
            jobPage = jobRepository.findAllByRecruiter_IdAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(
                    recruiterId,
                    title,
                    pageable
            );
        } else {
            // Recruiter-only listing (no status/title filters) -> fully DB-backed pageable query
            jobPage = jobRepository.findAllByRecruiter_IdOrderByCreatedAtDesc(recruiterId, pageable);
        }


        // Map jobs -> DTOs (preserve existing DTO field mapping)
        List<JobDTO> dtoItems = new ArrayList<>();
        for (Job j : jobPage.getContent()) {
            if (j == null) continue;
            dtoItems.add(JobDTO.builder()
                    .id(j.getId())
                    .title(j.getTitle())
                    .description(j.getDescription())
                    .requiredSkills(j.getRequiredSkills())
                    .salaryMin(j.getSalaryMin())
                    .salaryMax(j.getSalaryMax())
                    .location(j.getLocation())
                    .employmentType(j.getEmploymentType())
                    .workMode(j.getWorkMode())
                    .experience(j.getExperience())
.deadline(j.getDeadline())
                    .status(j.getStatus())
                    .createdAt(j.getCreatedAt())
                    .company(mapperService.companyToDTO(j.getCompany()))
                    .build());
        }

        return new org.springframework.data.domain.PageImpl<>(dtoItems, pageable, jobPage.getTotalElements());
    }


    /**
     * Backwards-compatible method used by current controller.
     */
    public List<Job> listJobs() {
        return jobRepository.findAll();
    }
}


