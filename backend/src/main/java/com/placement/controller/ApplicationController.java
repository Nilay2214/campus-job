package com.placement.controller;

import com.placement.dto.ApplicationDTO;
import com.placement.service.ApplicationService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Student Applications", description = "Endpoints for students to apply to jobs, view their applications, and withdraw. Requires a valid JWT token with STUDENT role.")
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping("/{jobId}")
    @Operation(
            summary = "Apply to a job",
            description = "Creates a new application (status PENDING) for the authenticated student against the given job. " +
                          "Fails if the job is not ACTIVE or the student has already applied."
    )
@ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Application created",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApplicationDTO.class),
                            examples = @ExampleObject(value = "{\"id\":1,\"status\":\"PENDING\",\"appliedAt\":\"2026-08-04T10:00:00\",\"jobId\":1,\"jobTitle\":\"Software Engineer\",\"jobStatus\":\"ACTIVE\"}"))),
            @ApiResponse(responseCode = "400", description = "Job not found, job not active, or duplicate application",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Application already exists for this job\"}"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}")))
    })
    public ResponseEntity<ApplicationDTO> apply(
            @Parameter(description = "Job ID to apply to", example = "1", required = true)
            @PathVariable Long jobId) {
        return ResponseEntity.ok(applicationService.applyToJob(jobId));
    }

    @GetMapping
    @Operation(
            summary = "Get my applications",
            description = "Returns the list of applications submitted by the authenticated student."
    )
@ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "List of student applications",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApplicationDTO.class),
                            examples = @ExampleObject(value = "[{\"id\":1,\"status\":\"PENDING\",\"appliedAt\":\"2026-08-04T10:00:00\",\"jobId\":1,\"jobTitle\":\"Software Engineer\"}]"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}"))),
            @ApiResponse(responseCode = "403", description = "User is not a STUDENT",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Access Denied\"}")))
    })
    public ResponseEntity<List<ApplicationDTO>> myApplications() {
        return ResponseEntity.ok(applicationService.getMyApplications());
    }

    @DeleteMapping("/{applicationId}")
    @Operation(
            summary = "Withdraw an application",
            description = "Withdraws a pending application belonging to the authenticated student. " +
                          "Only applications with status PENDING can be withdrawn."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Application withdrawn (no content)"),
            @ApiResponse(responseCode = "400", description = "Application not found or cannot be withdrawn in current status",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Application cannot be withdrawn in its current status\"}"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}"))),
            @ApiResponse(responseCode = "403", description = "Application does not belong to the authenticated student",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Forbidden\"}")))
    })
    public ResponseEntity<Void> withdraw(
            @Parameter(description = "Application ID to withdraw", example = "1", required = true)
            @PathVariable Long applicationId) {
        applicationService.withdrawApplication(applicationId);
        return ResponseEntity.noContent().build();
    }
}


