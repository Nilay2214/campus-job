package com.placement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Job title is required")
    private String title;

    @NotBlank(message = "Job description is required")
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String eligibility;

    @Column(columnDefinition = "TEXT")
    private String requiredSkills;

    @NotBlank(message = "Location is required")
    private String location;

    @Positive(message = "Minimum salary must be positive")
    private BigDecimal salaryMin;

    @Positive(message = "Maximum salary must be positive")
    private BigDecimal salaryMax;

    @NotBlank(message = "Employment type is required")
    private String employmentType; // Full-time, Part-time, Contract, etc.

    private String workMode; // Remote, On-site, Hybrid

    /**
     * Minimum experience required for this job (e.g., "0-2", "3-5", "5+", or "Fresher").
     */
    private String experience;

    @NotNull(message = "Deadline is required")
    private LocalDateTime deadline;

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, CLOSED, DRAFT

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @NotNull(message = "Company is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recruiter_user_id")
    private User recruiter;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
