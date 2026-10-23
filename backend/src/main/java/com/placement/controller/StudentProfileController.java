package com.placement.controller;

import com.placement.dto.StudentProfileRequest;
import com.placement.entity.StudentProfile;
import com.placement.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
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
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Student Profile", description = "Endpoints to manage the authenticated student's profile and resume. Requires a valid JWT token with STUDENT role.")
public class StudentProfileController {

    private static final long MAX_RESUME_BYTES = 5L * 1024L * 1024L; // 5 MB

    private final StudentService studentService;

    @PostMapping("/profile")
    @Operation(
            summary = "Save or update student profile",
            description = "Creates or updates the authenticated student's profile. Requires a valid JWT token with STUDENT role."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile saved/updated",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = StudentProfile.class),
                            examples = @ExampleObject(value = "{\"id\":1,\"user\":{\"id\":1,\"email\":\"student@example.com\",\"role\":\"STUDENT\",\"enabled\":true},\"fullName\":\"John Doe\",\"phone\":\"9876543210\",\"department\":\"Computer Science\",\"branch\":\"CSE\",\"cgpa\":\"8.5\",\"resumeUrl\":\"https://resume-bucket/student-1.pdf\",\"skills\":\"Java, Spring Boot, React\",\"graduationYear\":\"2026\"}"))),
            @ApiResponse(responseCode = "400", description = "Invalid request body or validation errors",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"fullName\":\"Full name is required\",\"phone\":\"Phone must be exactly 10 digits\"}"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}"))),
            @ApiResponse(responseCode = "403", description = "User is not a STUDENT",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Access Denied\"}")))
    })
    public ResponseEntity<StudentProfile> saveProfile(@RequestBody StudentProfileRequest request) {
        return ResponseEntity.ok(studentService.saveOrUpdateProfile(request));
    }

    @PostMapping(value = "/profile/resume", consumes = {"multipart/form-data"})
    @Operation(
            summary = "Upload student resume",
            description = "Uploads a PDF resume (max 5 MB) for the authenticated student. " +
                          "Note: As of the current implementation, storage is not yet implemented and the file is not persisted."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Resume received (storage not yet implemented)",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"success\":true,\"message\":\"Resume received successfully. Storage is not yet implemented.\"}"))),
            @ApiResponse(responseCode = "400", description = "Resume file missing, empty, too large, or not a PDF",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Resume file size must be <= 5 MB\"}"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}")))
    })
    public ResponseEntity<?> uploadResume(@RequestPart(name = "resume", required = false) MultipartFile resume) {
        // Validate request payload (no storage logic; controller delegates once StudentService supports it)
        if (resume == null) {
            throw new IllegalArgumentException("Resume file is required");
        }
        if (resume.isEmpty()) {
            throw new IllegalArgumentException("Resume file must not be empty");
        }
        if (resume.getSize() > MAX_RESUME_BYTES) {
            throw new IllegalArgumentException("Resume file size must be <= 5 MB");
        }

        String contentType = resume.getContentType();
        // Content-Type may be missing depending on client; enforce application/pdf when present.
        if (contentType != null && !"application/pdf".equalsIgnoreCase(contentType)) {
            throw new IllegalArgumentException("Resume must be a PDF (application/pdf)");
        }

// Delegate to StudentService, which persists the file and updates the profile.
        String resumeUrl = studentService.uploadResume(resume);

        return ResponseEntity.ok(java.util.Map.of(
                "success", true,
                "message", "Resume uploaded successfully",
                "resumeUrl", resumeUrl
        ));
    }

@DeleteMapping("/profile/resume")
    @Operation(
            summary = "Delete student resume",
            description = "Deletes the authenticated student's resume: clears the stored resume reference and removes the physical file if present. Requires a valid JWT token with STUDENT role."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Resume deleted"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}"))),
            @ApiResponse(responseCode = "403", description = "User is not a STUDENT",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Access Denied\"}")))
    })
    public ResponseEntity<Void> deleteResume() {
        studentService.deleteResume();
        return ResponseEntity.noContent().build();
    }

@GetMapping("/profile")
    @Operation(
            summary = "Get student profile",
            description = "Returns the authenticated student's profile. Requires a valid JWT token with STUDENT role."
    )
@ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Student profile. If the authenticated student has never created a profile, an empty profile is automatically created and returned.",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = StudentProfile.class),
                            examples = @ExampleObject(value = "{\"id\":1,\"user\":{\"id\":1,\"email\":\"student@example.com\",\"role\":\"STUDENT\",\"enabled\":true},\"fullName\":\"John Doe\",\"phone\":\"9876543210\",\"department\":\"Computer Science\",\"branch\":\"CSE\",\"cgpa\":\"8.5\",\"resumeUrl\":\"https://resume-bucket/student-1.pdf\",\"skills\":\"Java, Spring Boot, React\",\"graduationYear\":\"2026\"}"))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}")))
    })
    public ResponseEntity<StudentProfile> getProfile() {
        return ResponseEntity.ok(studentService.getProfile());
    }
}
