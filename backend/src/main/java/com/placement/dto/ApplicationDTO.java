package com.placement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for an Application, exposing student + job details in a safe,
 * serializable shape (avoids lazy-loading issues from entities).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationDTO {
    private Long id;
    private String status;
    private LocalDateTime appliedAt;

    // Job snapshot
    private Long jobId;
    private String jobTitle;
    private String jobLocation;
    private String jobEmploymentType;
    private String jobWorkMode;
    private String jobExperience;
    private BigDecimal jobSalaryMin;
    private BigDecimal jobSalaryMax;
    private String jobStatus;
    private String companyName;

    // Student snapshot
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String studentPhone;
    private String studentBranch;
    private String studentCgpa;
    private String studentSkills;
    private String studentResumeUrl;
}
