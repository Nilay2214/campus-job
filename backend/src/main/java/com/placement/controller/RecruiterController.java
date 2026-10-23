package com.placement.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recruiters")
@PreAuthorize("hasRole('RECRUITER')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Recruiter Dashboard", description = "Recruiter dashboard endpoints. Requires a valid JWT token with RECRUITER role.")
public class RecruiterController {

    @GetMapping("/dashboard")
    @Operation(
            summary = "Recruiter dashboard status",
            description = "Returns a simple status message confirming the recruiter dashboard is available. " +
                          "Note: This is a placeholder endpoint; full recruiter functionality is not yet implemented."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Recruiter dashboard ready",
                    content = @Content(mediaType = "text/plain",
                            schema = @Schema(example = "Recruiter dashboard ready"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}"))),
            @ApiResponse(responseCode = "403", description = "User is not a RECRUITER",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Access Denied\"}")))
    })
    public ResponseEntity<String> dashboard() {
        return ResponseEntity.ok("Recruiter dashboard ready");
    }
}
