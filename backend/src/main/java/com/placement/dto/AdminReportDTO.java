package com.placement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Report aggregations for the admin Reports page.
 * All collections/maps are empty-safe.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminReportDTO {
    private long totalStudents;
    private long totalRecruiters;
    private long totalCompanies;
    private long totalJobs;
    private long activeJobs;
    private long totalApplications;
    private long pendingApplications;
    private long shortlistedApplications;
    private long selectedPlacements;
    private long rejectedApplications;
    private List<JobRow> topJobsByApplications;
    private List<CompanyRow> companiesByJobs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JobRow {
        private Long jobId;
        private String title;
        private String companyName;
        private long applicationCount;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompanyRow {
        private String companyName;
        private long jobCount;
    }
}
