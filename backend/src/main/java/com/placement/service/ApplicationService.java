package com.placement.service;

import com.placement.dto.ApplicationDTO;
import com.placement.entity.Application;
import com.placement.entity.Job;
import com.placement.entity.StudentProfile;
import com.placement.entity.User;
import com.placement.repository.ApplicationRepository;
import com.placement.repository.JobRepository;
import com.placement.repository.StudentProfileRepository;
import com.placement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final com.placement.service.MapperService mapperService;

    @Transactional
    public ApplicationDTO applyToJob(Long jobId) {
        if (jobId == null) {
            throw new IllegalArgumentException("jobId is required");
        }

        StudentProfile student = getAuthenticatedStudent();
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new com.placement.exception.ResourceNotFoundException("Job not found with id: " + jobId));

// Validate job is ACTIVE
        if (!Objects.equals(job.getStatus(), "ACTIVE")) {
            throw new IllegalArgumentException("Job is not active");
        }

        // Validate the application deadline has not passed. This mirrors the student-list
        // filtering in JobSpecification (deadline IS NULL OR deadline >= now) so that a job
        // which is no longer listed as available cannot be applied to by direct job id.
        if (job.getDeadline() != null && job.getDeadline().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Job application deadline has passed");
        }

        // Prevent duplicates using a dedicated DB query (no O(n) scan).
        if (applicationRepository.existsByStudentIdAndJobId(student.getId(), jobId)) {
            throw new IllegalArgumentException("Application already exists for this job");
        }

Application application = Application.builder()
                .student(student)
                .job(job)
                .status("PENDING")
                .appliedAt(LocalDateTime.now())
                .build();

        try {
            return mapperService.applicationToDTO(applicationRepository.save(application));
        } catch (DataIntegrityViolationException ex) {
            // A concurrent request may have created the same application between the
            // existsByStudentIdAndJobId check and the insert (race). Surface a clean
            // "already applied" message instead of an unhandled 500.
            throw new IllegalArgumentException("Application already exists for this job");
        }
    }

// NOTE: Not read-only. getAuthenticatedStudent() auto-creates an empty StudentProfile
    // for a newly registered student who has never created a profile. That profile save is a
    // write, so this method must run inside a read-write transaction (otherwise MySQL rejects
    // the write with "Connection is read-only" and the dashboard fails to load with HTTP 500).
    @Transactional
    public List<ApplicationDTO> getMyApplications() {
        StudentProfile student = getAuthenticatedStudent();
        return applicationRepository.findByStudent(student).stream()
                .map(mapperService::applicationToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void withdrawApplication(Long applicationId) {
        if (applicationId == null) {
            throw new IllegalArgumentException("applicationId is required");
        }

        StudentProfile student = getAuthenticatedStudent();
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new com.placement.exception.ResourceNotFoundException("Application not found with id: " + applicationId));

        // Ownership / IDOR check
        if (application.getStudent() == null || application.getStudent().getId() == null) {
            throw new IllegalArgumentException("Application ownership is invalid");
        }
        if (!Objects.equals(application.getStudent().getId(), student.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden");
        }

        // Allow withdraw only if status == PENDING
        if (!Objects.equals(application.getStatus(), "PENDING")) {
            throw new IllegalStateException("Application cannot be withdrawn in its current status");
        }

        // No soft-delete mechanism exists in current entity.
        applicationRepository.delete(application);
    }

private StudentProfile getAuthenticatedStudent() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Auto-create an empty profile for a newly registered student so that
        // application flows (e.g. fetching "My Applications") do not fail with
        // "Profile not found" when the student has never created a profile.
        return studentProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    StudentProfile profile = new StudentProfile();
                    profile.setUser(user);
                    return studentProfileRepository.save(profile);
                });
    }
}

