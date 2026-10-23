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
@RequestMapping("/api/students")
@PreAuthorize("hasRole('STUDENT')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Student Overview", description = "Student overview endpoints. Requires a valid JWT token with STUDENT role.")
public class StudentController {

    @GetMapping("/overview")
    @Operation(
            summary = "Student overview",
            description = "Returns a simple status message confirming the student overview endpoint is available. " +
                          "Note: This is a placeholder endpoint; full student overview functionality is not yet implemented."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Student overview endpoint",
                    content = @Content(mediaType = "text/plain",
                            schema = @Schema(example = "Student overview endpoint"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}"))),
            @ApiResponse(responseCode = "403", description = "User is not a STUDENT",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Access Denied\"}")))
    })
    public ResponseEntity<String> profile() {
        return ResponseEntity.ok("Student overview endpoint");
    }
}
