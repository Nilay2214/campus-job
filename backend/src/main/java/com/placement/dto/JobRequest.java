package com.placement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobRequest {
    @NotBlank(message = "Job title is required")
    private String title;

    @NotBlank(message = "Job description is required")
    private String description;

    private String eligibility;

    private String requiredSkills;

    @NotBlank(message = "Location is required")
    private String location;

    @Positive(message = "Minimum salary must be positive")
    private BigDecimal salaryMin;

    @Positive(message = "Maximum salary must be positive")
    private BigDecimal salaryMax;

    @NotBlank(message = "Employment type is required")
    private String employmentType;

    private String workMode;

    /**
     * Minimum experience required for this job (e.g., "0-2", "3-5", "5+", or "Fresher").
     */
    private String experience;

    @NotNull(message = "Deadline is required")
    private LocalDateTime deadline;

    @NotNull(message = "Company ID is required")
    private Long companyId;

    private String status;
}

