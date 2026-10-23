package com.placement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Aggregated statistics for the admin dashboard.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardStatsDTO {
    private long totalStudents;
    private long totalRecruiters;
    private long totalAdmins;
    private long totalCompanies;
    private long totalJobs;
    private long totalApplications;
    private long selectedPlacements;
}
