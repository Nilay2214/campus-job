package com.placement.service;

import com.placement.dto.StudentProfileRequest;
import com.placement.entity.StudentProfile;
import com.placement.entity.User;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.StudentProfileRepository;
import com.placement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class StudentService {

private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public StudentProfile saveOrUpdateProfile(StudentProfileRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));

        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(StudentProfile.builder().user(user).build());
        profile.setFullName(request.getFullName());
        profile.setPhone(request.getPhone());
        profile.setDepartment(request.getDepartment());
        profile.setBranch(request.getBranch());
        profile.setCgpa(request.getCgpa());
profile.setResumeUrl(request.getResumeUrl());
        profile.setSkills(request.getSkills());
        profile.setGraduationYear(request.getGraduationYear());
        profile.setLinkedInUrl(request.getLinkedInUrl());
        profile.setGithubUrl(request.getGithubUrl());
        profile.setPortfolioUrl(request.getPortfolioUrl());
        profile.setAddress(request.getAddress());
        profile.setAboutMe(request.getAboutMe());

        return studentProfileRepository.save(profile);
    }

    public StudentProfile getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Return the existing profile when present; otherwise auto-create an empty
        // profile linked to the authenticated user so that a newly registered student
        // who has never created a profile does not receive a "Profile not found" error.
        return studentProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    StudentProfile profile = new StudentProfile();
                    profile.setUser(user);
                    return studentProfileRepository.save(profile);
                });
    }

/**
     * Delete the authenticated student's resume: clears the DB reference and
     * removes the physical file if it exists. Safe when the file is already missing.
     */
    public void deleteResume() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));

        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        if (profile == null || profile.getResumeUrl() == null || profile.getResumeUrl().isBlank()) {
            // Nothing to delete.
            return;
        }

        String existingUrl = profile.getResumeUrl();
        // Clear the DB reference.
        profile.setResumeUrl(null);
        studentProfileRepository.save(profile);

        // Remove the physical file if it exists (missing file -> no-op).
        fileStorageService.delete(existingUrl);
    }

public String uploadResume(MultipartFile resume) {
        if (resume == null || resume.isEmpty()) {
            throw new IllegalArgumentException("Resume file is required");
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Persist the file and get a public URL path.
        String resumeUrl = fileStorageService.store(resume);

        // Associate the uploaded resume with the authenticated student's profile.
        StudentProfile profile = studentProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    StudentProfile p = new StudentProfile();
                    p.setUser(user);
                    return p;
                });
        profile.setResumeUrl(resumeUrl);
        studentProfileRepository.save(profile);

        return resumeUrl;
    }
}

