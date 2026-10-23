package com.placement.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class StudentProfileRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be exactly 10 digits")
    private String phone;

    private String department;
    private String branch;

    @DecimalMin(value = "0.0", inclusive = true, message = "CGPA must be at least 0.0")
    @DecimalMax(value = "10.0", inclusive = true, message = "CGPA must be at most 10.0")
    private String cgpa;

    private String resumeUrl;
    private String skills;

    private String graduationYear;

    private String linkedInUrl;
    private String githubUrl;
    private String portfolioUrl;
    private String address;
    private String aboutMe;
}
