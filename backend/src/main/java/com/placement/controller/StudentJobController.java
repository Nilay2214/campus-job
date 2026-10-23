package com.placement.controller;

import com.placement.dto.JobDTO;
import com.placement.dto.JobDetailDTO;
import com.placement.dto.JobSearchCriteria;
import com.placement.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/students/jobs")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Job Search (Students)", description = "Endpoints to browse and search jobs. Accessible by STUDENT, RECRUITER, and ADMIN roles. Requires a valid JWT token.")
public class StudentJobController {

    private final JobService jobService;

    /**
     * Get all jobs with advanced filtering, pagination, and sorting
     * 
     * @param title Job title search
     * @param location Job location filter
     * @param salaryMin Minimum salary filter
     * @param salaryMax Maximum salary filter
     * @param skills Required skills filter
     * @param companyId Company ID filter
     * @param employmentType Employment type filter
     * @param workMode Work mode filter
     * @param pageNumber Page number (0-indexed)
     * @param pageSize Page size
     * @param sortBy Sort by field (default: createdAt)
     * @param sortDirection Sort direction (asc/desc)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'RECRUITER', 'ADMIN')")
    @Operation(
            summary = "Get all jobs (filtered, paginated, sorted)",
            description = "Returns a paginated list of jobs with optional search, filter, pagination, and sorting. " +
                          "Only active jobs are returned by default. Requires a valid JWT token."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Paginated list of jobs",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = Page.class),
                            examples = @ExampleObject(value = "{\"content\":[{\"id\":1,\"title\":\"Software Engineer\",\"description\":\"...\",\"requiredSkills\":\"Java, Spring, React\",\"salaryMin\":800000,\"salaryMax\":1500000,\"location\":\"Bangalore\",\"employmentType\":\"FULL_TIME\",\"workMode\":\"HYBRID\",\"experience\":\"0-2\",\"deadline\":\"2026-12-31T23:59:59\",\"status\":\"ACTIVE\",\"createdAt\":\"2026-08-04T10:00:00\",\"company\":{\"id\":1,\"name\":\"TechCorp\",\"logo\":null,\"location\":\"Bangalore\"}}],\"pageable\":{\"pageNumber\":0,\"pageSize\":10},\"totalElements\":1,\"totalPages\":1,\"last\":true,\"first\":true}"))),
            @ApiResponse(responseCode = "400", description = "Invalid query parameters (pageNumber < 0, pageSize out of range, invalid sortBy)",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"pageSize must be between 1 and 100\"}"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}")))
    })
    public ResponseEntity<Page<JobDTO>> getAllJobs(
            @Parameter(description = "Job title search (partial match)", example = "Software")
            @RequestParam(required = false) String title,
            @Parameter(description = "Job location filter", example = "Bangalore")
            @RequestParam(required = false) String location,
            @Parameter(description = "Minimum salary filter (annual, in INR)", example = "500000")
            @RequestParam(required = false) BigDecimal salaryMin,
            @Parameter(description = "Maximum salary filter (annual, in INR)", example = "2000000")
            @RequestParam(required = false) BigDecimal salaryMax,
            @Parameter(description = "Required skills filter (comma-separated)", example = "Java,Spring")
            @RequestParam(required = false) String skills,
            @Parameter(description = "Company ID filter", example = "1")
            @RequestParam(required = false) Long companyId,
            @Parameter(description = "Employment type filter", example = "FULL_TIME")
            @RequestParam(required = false) String employmentType,
            @Parameter(description = "Work mode filter", example = "HYBRID")
            @RequestParam(required = false) String workMode,
            @Parameter(description = "Page number (0-indexed)", example = "0")
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @Parameter(description = "Page size (1-100)", example = "10")
            @RequestParam(defaultValue = "10") Integer pageSize,
            @Parameter(description = "Sort field (createdAt, deadline, salaryMin, salaryMax, title)", example = "createdAt")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)", example = "desc")
            @RequestParam(defaultValue = "desc") String sortDirection) {

        if (pageNumber < 0) {
            throw new IllegalArgumentException("pageNumber must be >= 0");
        }
        if (pageSize <= 0 || pageSize > 100) {
            throw new IllegalArgumentException("pageSize must be between 1 and 100");
        }

        if (sortBy == null || sortBy.isBlank()) {
            throw new IllegalArgumentException("sortBy is required");
        }

        // Whitelist known sortable columns to avoid arbitrary property access
        if (!sortBy.equals("createdAt") && !sortBy.equals("deadline") && !sortBy.equals("salaryMin") && !sortBy.equals("salaryMax") && !sortBy.equals("title")) {
            throw new IllegalArgumentException("sortBy is not allowed");
        }

        log.info("Fetching jobs with filters - title: {}, location: {}, salaryMin: {}, salaryMax: {}",
                 title, location, salaryMin, salaryMax);

        JobSearchCriteria criteria = JobSearchCriteria.builder()
            .title(title)
            .location(location)
            .salaryMin(salaryMin)
            .salaryMax(salaryMax)
            .requiredSkills(skills)
            .companyId(companyId)
            .employmentType(employmentType)
            .workMode(workMode)
            .pageNumber(pageNumber)
            .pageSize(pageSize)
            .sortBy(sortBy)
            .sortDirection(sortDirection)
            .build();

        Page<JobDTO> jobs = jobService.getAllJobs(criteria);
        log.info("Returning {} jobs", jobs.getTotalElements());
        
        return ResponseEntity.ok(jobs);
    }

/**
     * Get job details by ID
     * 
     * @param id Job ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'RECRUITER', 'ADMIN')")
    @Operation(
            summary = "Get job details by ID",
            description = "Returns detailed information about a single job, including company details. Requires a valid JWT token."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Job details",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = JobDetailDTO.class),
                            examples = @ExampleObject(value = "{\"id\":1,\"title\":\"Software Engineer\",\"description\":\"Build scalable systems\",\"eligibility\":\"B.Tech CSE, 6+ CGPA\",\"requiredSkills\":\"Java, Spring Boot, React\",\"salaryMin\":800000,\"salaryMax\":1500000,\"location\":\"Bangalore\",\"employmentType\":\"FULL_TIME\",\"workMode\":\"HYBRID\",\"experience\":\"0-2\",\"deadline\":\"2026-12-31T23:59:59\",\"status\":\"ACTIVE\",\"createdAt\":\"2026-08-04T10:00:00\",\"updatedAt\":null,\"company\":{\"id\":1,\"name\":\"TechCorp\",\"industry\":\"IT\",\"website\":\"https://techcorp.com\",\"location\":\"Bangalore\",\"description\":\"A software company\",\"logo\":null,\"createdAt\":\"2026-07-01T09:00:00\"}}"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}"))),
            @ApiResponse(responseCode = "404", description = "Job not found",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Job not found with id: 999\"}")))
    })
    public ResponseEntity<JobDetailDTO> getJobById(
            @Parameter(description = "Job ID", example = "1", required = true)
            @PathVariable Long id) {
        log.info("Fetching job with id: {}", id);
        JobDetailDTO job = jobService.getJobById(id);
        return ResponseEntity.ok(job);
    }

    /**
     * Get active jobs for students
     * 
     * @param pageNumber Page number (0-indexed)
     * @param pageSize Page size
     */
    @GetMapping("/active/list")
    @PreAuthorize("hasAnyRole('STUDENT', 'RECRUITER', 'ADMIN')")
    @Operation(
            summary = "Get active jobs",
            description = "Returns a paginated list of jobs with status ACTIVE, sorted by creation date descending. Requires a valid JWT token."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Paginated list of active jobs",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = Page.class),
                            examples = @ExampleObject(value = "{\"content\":[{\"id\":1,\"title\":\"Software Engineer\",\"status\":\"ACTIVE\"}],\"totalElements\":1,\"totalPages\":1}"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}")))
    })
    public ResponseEntity<Page<JobDTO>> getActiveJobs(
            @Parameter(description = "Page number (0-indexed)", example = "0")
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @Parameter(description = "Page size (1-100)", example = "10")
            @RequestParam(defaultValue = "10") Integer pageSize) {
        
        log.info("Fetching active jobs - page: {}, size: {}", pageNumber, pageSize);
        Page<JobDTO> jobs = jobService.getActiveJobs(pageNumber, pageSize);
        
        return ResponseEntity.ok(jobs);
    }
}
