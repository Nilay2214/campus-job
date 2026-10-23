package com.placement.controller;

import com.placement.dto.JobDTO;
import com.placement.dto.JobDetailDTO;
import com.placement.dto.JobRequest;
import com.placement.service.RecruiterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recruiters")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RECRUITER')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Recruiter Jobs", description = "Endpoints for recruiters to create and manage their jobs. Requires a valid JWT token with RECRUITER role.")
public class RecruiterJobController {

    private final RecruiterService recruiterService;

@PostMapping("/jobs")
    @Operation(
            summary = "Create a new job",
            description = "Creates a job for the authenticated recruiter. The company must already exist (referenced by companyId)."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Job created",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = JobDetailDTO.class),
                            examples = @ExampleObject(value = "{\"id\":1,\"title\":\"Software Engineer\",\"description\":\"Build scalable systems\",\"location\":\"Bangalore\",\"employmentType\":\"FULL_TIME\",\"workMode\":\"HYBRID\",\"deadline\":\"2026-12-31T23:59:59\",\"status\":\"ACTIVE\",\"createdAt\":\"2026-08-04T10:00:00\",\"company\":{\"id\":1,\"name\":\"TechCorp\"}}"))),
            @ApiResponse(responseCode = "400", description = "Invalid request body",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Company not found\"}"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}"))),
            @ApiResponse(responseCode = "403", description = "User is not a RECRUITER",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Access Denied\"}")))
    })
    public ResponseEntity<JobDetailDTO> createJob(@Valid @RequestBody JobRequest request) {
        return ResponseEntity.ok(recruiterService.createJob(request));
    }

    @GetMapping("/jobs/{jobId}")
    @Operation(
            summary = "Get a recruiter's job by ID",
            description = "Returns details of a job owned by the authenticated recruiter."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Job details",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = JobDetailDTO.class))),
            @ApiResponse(responseCode = "404", description = "Job not found or not owned by you",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Job not found or not owned by you\"}"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}")))
    })
    public ResponseEntity<JobDetailDTO> getJob(
            @Parameter(description = "Job ID", example = "1", required = true)
            @PathVariable Long jobId) {
        return ResponseEntity.ok(recruiterService.getJob(jobId));
    }

    @PutMapping("/jobs/{jobId}")
    @Operation(
            summary = "Update a recruiter's job",
            description = "Updates a job owned by the authenticated recruiter."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Job updated",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = JobDetailDTO.class))),
            @ApiResponse(responseCode = "404", description = "Job not found or not owned by you",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Job not found or not owned by you\"}"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}")))
    })
    public ResponseEntity<JobDetailDTO> updateJob(
            @Parameter(description = "Job ID", example = "1", required = true)
            @PathVariable Long jobId,
            @Valid @RequestBody JobRequest request) {
        return ResponseEntity.ok(recruiterService.updateJob(jobId, request));
    }

    @DeleteMapping("/jobs/{jobId}")
    @Operation(
            summary = "Delete a recruiter's job",
            description = "Deletes a job owned by the authenticated recruiter."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Job deleted"),
            @ApiResponse(responseCode = "404", description = "Job not found or not owned by you",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Job not found or not owned by you\"}"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}")))
    })
    public ResponseEntity<Void> deleteJob(
            @Parameter(description = "Job ID", example = "1", required = true)
            @PathVariable Long jobId) {
        recruiterService.deleteJob(jobId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/jobs")
    @Operation(
            summary = "List recruiter's jobs",
            description = "Returns a paginated list of jobs belonging to the authenticated recruiter, with optional status and title filters."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Paginated list of recruiter jobs",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = Page.class),
                            examples = @ExampleObject(value = "{\"content\":[{\"id\":1,\"title\":\"Software Engineer\",\"status\":\"ACTIVE\",\"createdAt\":\"2026-08-04T10:00:00\"}],\"totalElements\":1,\"totalPages\":1}"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}")))
    })
    public ResponseEntity<Page<JobDTO>> listJobs(
            @Parameter(description = "Page number (0-indexed)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size (1-100)", example = "10")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort field (createdAt, deadline, salaryMin, salaryMax, title)", example = "createdAt")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)", example = "desc")
            @RequestParam(defaultValue = "desc") String direction,
            @Parameter(description = "Filter by job status (ACTIVE, CLOSED, DRAFT)", example = "ACTIVE")
            @RequestParam(required = false) String status,
            @Parameter(description = "Filter by job title (partial match)", example = "Software")
            @RequestParam(required = false) String title) {

// Delegate all business logic (ownership filtering, pagination, DTO mapping) to the service layer.
        return ResponseEntity.ok(recruiterService.listJobs(page, size, sortBy, direction, status, title));
    }
}

