package com.placement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobSearchCriteria {
    private String title;
    private String location;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private String requiredSkills;
    private Long companyId;
    private String employmentType;
    private String workMode;
    private String status;
    private Integer pageNumber;
    private Integer pageSize;
    private String sortBy;
    private String sortDirection;
}
