package com.placement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Aggregated analytics used by the admin Placement Analytics page.
 * All collections are empty-safe so the frontend can render empty states.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAnalyticsDTO {
    private Map<String, Long> applicationsByStatus;
    private List<MonthlyCount> applicationsByMonth;
    private List<MonthlyCount> placementsByMonth;
    private List<MonthlyCount> userGrowth;
    private List<CompanyJobs> topCompanies;
    private Map<String, Long> jobsByType;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyCount {
        private int year;
        private int month;
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompanyJobs {
        private String companyName;
        private long jobCount;
        private long applicationCount;
    }
}
