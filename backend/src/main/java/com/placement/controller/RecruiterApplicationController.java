package com.placement.controller;

import com.placement.dto.ApplicationDTO;
import com.placement.dto.ApplicationStatusRequest;
import com.placement.service.RecruiterApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Recruiter-facing endpoints to review and update the status of applications
 * received against jobs owned by the authenticated recruiter.
 */
@RestController
@RequestMapping("/api/recruiters/applications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RECRUITER')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Recruiter Applications", description = "Endpoints for recruiters to review applications against their jobs.")
public class RecruiterApplicationController {

    private final RecruiterApplicationService recruiterApplicationService;

    @GetMapping
    @Operation(
            summary = "List applications for the recruiter's jobs",
            description = "Returns a paginated list of applications received against jobs owned by the authenticated recruiter."
    )
public ResponseEntity<Page<ApplicationDTO>> listApplications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appliedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) Long jobId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(recruiterApplicationService.listApplications(page, size, sortBy, direction, jobId, status));
    }

    @PatchMapping("/{applicationId}/status")
    @Operation(
            summary = "Update application status",
            description = "Updates the status (PENDING, SHORTLISTED, SELECTED, REJECTED) of an application for a job owned by the recruiter."
    )
    public ResponseEntity<ApplicationDTO> updateStatus(
            @PathVariable Long applicationId,
            @Valid @RequestBody ApplicationStatusRequest request) {
        return ResponseEntity.ok(recruiterApplicationService.updateStatus(applicationId, request));
    }
}
