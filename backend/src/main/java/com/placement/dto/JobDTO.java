package com.placement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobDTO {
    private Long id;
    private String title;
    private String description;
    private String requiredSkills;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private String location;
    private String employmentType;
    private String workMode;
    private String experience;
    private LocalDateTime deadline;
    private String status;
    private LocalDateTime createdAt;
    private CompanyDTO company;
}
