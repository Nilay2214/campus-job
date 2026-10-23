package com.placement.controller;

import com.placement.entity.Application;
import com.placement.entity.Job;
import com.placement.entity.StudentProfile;
import com.placement.entity.User;
import com.placement.repository.ApplicationRepository;
import com.placement.repository.StudentProfileRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Objects;

/**
 * Secured resume download endpoint.
 *
 * <p>Resumes are served through this controller (never through the static {@code /uploads/**}
 * mapping, which is now {@code denyAll()} in {@link com.placement.config.SecurityConfig}).</p>
 *
 * <p>Authorization rules:
 * <ul>
 *   <li>STUDENT: may download their own resume.</li>
 *   <li>RECRUITER: may download resumes of students who applied to jobs they own.</li>
 *   <li>ADMIN: may download any resume.</li>
 * </ul>
 */
@Controller
@RequestMapping("/api/resumes")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Resume Access", description = "Authenticated, authorization-checked resume download endpoint.")
public class ResumeAccessController {

    private final StudentProfileRepository studentProfileRepository;
    private final ApplicationRepository applicationRepository;
    private final Path rootLocation;

    public ResumeAccessController(
            StudentProfileRepository studentProfileRepository,
            ApplicationRepository applicationRepository,
            @Value("${uploads.resume-dir:./uploads/resumes}") String resumeDir) {
        this.studentProfileRepository = studentProfileRepository;
        this.applicationRepository = applicationRepository;
        this.rootLocation = Paths.get(resumeDir).toAbsolutePath().normalize();
    }

    /**
     * Download a resume by student profile id.
     */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'RECRUITER', 'ADMIN')")
    @Operation(summary = "Download a student's resume (authorized)")
    public ResponseEntity<Resource> getResume(@PathVariable Long studentId) throws MalformedURLException {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String role = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> a.startsWith("ROLE_"))
                .findFirst().orElse("");

        StudentProfile profile = studentProfileRepository.findById(studentId).orElse(null);
        if (profile == null || profile.getResumeUrl() == null || profile.getResumeUrl().isBlank()) {
            return ResponseEntity.notFound().build();
        }

        // Authorization: owner, recruiter with an application to their own job, or ADMIN.
        if (!isAdmin(role) && !canAccess(email, profile)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Serve the file.
        return serveFile(profile.getResumeUrl());
    }

    private boolean isAdmin(String role) {
        return "ROLE_ADMIN".equals(role);
    }

    private boolean canAccess(String email, StudentProfile profile) {
        User owner = profile.getUser();
        if (owner == null || owner.getEmail() == null) {
            return false;
        }

        // Resume owner
        if (Objects.equals(email, owner.getEmail())) {
            return true;
        }

        // Recruiter: applications for their own jobs
        List<Application> appsForProfile = applicationRepository.findByStudent(profile);
        for (Application app : appsForProfile) {
            Job job = app.getJob();
            if (job != null && job.getRecruiter() != null
                    && job.getRecruiter().getEmail() != null
                    && Objects.equals(job.getRecruiter().getEmail(), email)) {
                return true;
            }
        }

        return false;
    }

    private ResponseEntity<Resource> serveFile(String resumeUrl) throws MalformedURLException {
        String filename = resumeUrl.substring(resumeUrl.lastIndexOf('/') + 1);
        Path target = rootLocation.resolve(filename).normalize();
        if (!target.startsWith(rootLocation) || !Files.exists(target)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(target.toUri());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }
}
