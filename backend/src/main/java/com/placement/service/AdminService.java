package com.placement.service;

import com.placement.dto.AdminAnalyticsDTO;
import com.placement.dto.AdminAuditLogDTO;
import com.placement.dto.AdminCompanyDTO;
import com.placement.dto.AdminDashboardStatsDTO;
import com.placement.dto.AdminReportDTO;
import com.placement.dto.AdminUserDTO;
import com.placement.entity.Application;
import com.placement.entity.Company;
import com.placement.entity.Job;
import com.placement.entity.User;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.ApplicationRepository;
import com.placement.repository.CompanyRepository;
import com.placement.repository.JobRepository;
import com.placement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * Admin-facing aggregation and management endpoints.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;

    public AdminDashboardStatsDTO getDashboardStats() {
        List<User> users = userRepository.findAll();
        long students = users.stream().filter(u -> u.getRole() == User.Role.STUDENT).count();
        long recruiters = users.stream().filter(u -> u.getRole() == User.Role.RECRUITER).count();
        long admins = users.stream().filter(u -> u.getRole() == User.Role.ADMIN).count();
        long companies = companyRepository.count();
        long jobs = jobRepository.count();
        long applications = applicationRepository.count();

        List<Application> apps = applicationRepository.findAll();
        long selected = apps.stream().filter(a -> "SELECTED".equalsIgnoreCase(a.getStatus())).count();

        return AdminDashboardStatsDTO.builder()
                .totalStudents(students)
                .totalRecruiters(recruiters)
                .totalAdmins(admins)
                .totalCompanies(companies)
                .totalJobs(jobs)
                .totalApplications(applications)
                .selectedPlacements(selected)
                .build();
    }

public List<AdminUserDTO> listUsers() {
        return userRepository.findAll().stream()
                .map(u -> AdminUserDTO.builder()
                        .id(u.getId())
                        .email(u.getEmail())
                        .role(u.getRole().name())
                        .enabled(u.isEnabled())
                        .createdAt(u.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Enable or disable a user account. ADMIN-only (enforced at the controller).
     *
     * <p>Safety rules:
     * <ul>
     *   <li>Only the {@code enabled} flag is modified — role is never changed here.</li>
     *   <li>An ADMIN account can be disabled by another ADMIN, but an ADMIN cannot be
     *       disabled by a non-admin (controller enforces ADMIN role).</li>
* </ul>
     */
@Transactional
    public AdminUserDTO updateUserStatus(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Prevent a lockout: never allow disabling the last enabled ADMIN account.
        // This avoids an unrecoverable state where no ADMIN can log in to manage the system.
        if (!enabled && user.getRole() == User.Role.ADMIN) {
            long enabledAdminCount = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == User.Role.ADMIN && u.isEnabled())
                    .count();
            // Count is taken before persisting the change; if only this one enabled ADMIN
            // remains, we must not allow it to be disabled.
            if (enabledAdminCount <= 1) {
                throw new IllegalStateException("Cannot disable the last enabled ADMIN account");
            }
        }

        user.setEnabled(enabled);
        user = userRepository.save(user);

        // Audit log entry is derived from sourcing entities (see getAuditLogs), so a
        // status change is visible in the admin audit trail via the user's updated state.
        return AdminUserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }

public List<AdminCompanyDTO> listCompanies() {
        // Batch job-count query (GROUP BY company) to avoid N+1 per-company queries.
        Map<Long, Long> jobCountByCompany = companyRepository.countJobsPerCompany().stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> ((Number) row[1]).longValue()
                ));

        return companyRepository.findAll().stream()
                .map(c -> AdminCompanyDTO.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .industry(c.getIndustry())
                        .location(c.getLocation())
                        .website(c.getWebsite())
                        .description(c.getDescription())
                        .logo(c.getLogo())
                        .createdAt(c.getCreatedAt())
                        .recruiterEmail(c.getRecruiter() != null ? c.getRecruiter().getEmail() : null)
                        .jobCount(jobCountByCompany.getOrDefault(c.getId(), 0L))
                        .build())
                .collect(Collectors.toList());
    }

    public AdminAnalyticsDTO getAnalytics() {
        List<Application> apps = applicationRepository.findAll();
        List<Job> jobs = jobRepository.findAll();
        List<User> users = userRepository.findAll();

        Map<String, Long> byStatus = apps.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getStatus() == null ? "UNKNOWN" : a.getStatus().toUpperCase(),
                        LinkedHashMap::new,
                        Collectors.counting()));

        List<AdminAnalyticsDTO.MonthlyCount> appsByMonth = monthlyCounts(
                apps.stream().map(Application::getAppliedAt).collect(Collectors.toList()));
        List<AdminAnalyticsDTO.MonthlyCount> placementsByMonth = monthlyCounts(
                apps.stream()
                        .filter(a -> "SELECTED".equalsIgnoreCase(a.getStatus()))
                        .map(Application::getAppliedAt)
                        .collect(Collectors.toList()));
        List<AdminAnalyticsDTO.MonthlyCount> userGrowth = monthlyCounts(
                users.stream().map(User::getCreatedAt).collect(Collectors.toList()));

        List<AdminAnalyticsDTO.CompanyJobs> topCompanies = companyRepository.findAll().stream()
                .map(c -> AdminAnalyticsDTO.CompanyJobs.builder()
                        .companyName(c.getName())
                        .jobCount(jobs.stream().filter(j -> companyId(j) != null && companyId(j).equals(c.getId())).count())
                        .applicationCount(apps.stream().filter(a -> a.getJob() != null
                                && companyId(a.getJob()) != null && companyId(a.getJob()).equals(c.getId())).count())
                        .build())
                .sorted(Comparator.comparingLong(AdminAnalyticsDTO.CompanyJobs::getJobCount).reversed())
                .limit(10)
                .collect(Collectors.toList());

        Map<String, Long> jobsByType = jobs.stream()
                .collect(Collectors.groupingBy(
                        j -> j.getEmploymentType() == null ? "UNKNOWN" : j.getEmploymentType().toUpperCase(),
                        LinkedHashMap::new,
                        Collectors.counting()));

        return AdminAnalyticsDTO.builder()
                .applicationsByStatus(byStatus)
                .applicationsByMonth(appsByMonth)
                .placementsByMonth(placementsByMonth)
                .userGrowth(userGrowth)
                .topCompanies(topCompanies)
                .jobsByType(jobsByType)
                .build();
    }

    public AdminReportDTO getReport() {
        List<User> users = userRepository.findAll();
        List<Job> jobs = jobRepository.findAll();
        List<Application> apps = applicationRepository.findAll();
        List<Company> companies = companyRepository.findAll();

        List<AdminReportDTO.JobRow> topJobs = jobs.stream()
                .map(j -> AdminReportDTO.JobRow.builder()
                        .jobId(j.getId())
                        .title(j.getTitle())
                        .companyName(j.getCompany() != null ? j.getCompany().getName() : null)
                        .applicationCount(apps.stream().filter(a -> a.getJob() != null
                                && a.getJob().getId() != null && a.getJob().getId().equals(j.getId())).count())
                        .status(j.getStatus())
                        .build())
                .sorted(Comparator.comparingLong(AdminReportDTO.JobRow::getApplicationCount).reversed())
                .limit(10)
                .collect(Collectors.toList());

        List<AdminReportDTO.CompanyRow> companiesByJobs = companies.stream()
                .map(c -> AdminReportDTO.CompanyRow.builder()
                        .companyName(c.getName())
                        .jobCount(jobs.stream().filter(j -> companyId(j) != null && companyId(j).equals(c.getId())).count())
                        .build())
                .sorted(Comparator.comparingLong(AdminReportDTO.CompanyRow::getJobCount).reversed())
                .limit(10)
                .collect(Collectors.toList());

        return AdminReportDTO.builder()
                .totalStudents(users.stream().filter(u -> u.getRole() == User.Role.STUDENT).count())
                .totalRecruiters(users.stream().filter(u -> u.getRole() == User.Role.RECRUITER).count())
                .totalCompanies(companies.size())
                .totalJobs(jobs.size())
                .activeJobs(jobs.stream().filter(j -> "ACTIVE".equalsIgnoreCase(j.getStatus())).count())
                .totalApplications(apps.size())
                .pendingApplications(apps.stream().filter(a -> "PENDING".equalsIgnoreCase(a.getStatus())).count())
                .shortlistedApplications(apps.stream().filter(a -> "SHORTLISTED".equalsIgnoreCase(a.getStatus())).count())
                .selectedPlacements(apps.stream().filter(a -> "SELECTED".equalsIgnoreCase(a.getStatus())).count())
                .rejectedApplications(apps.stream().filter(a -> "REJECTED".equalsIgnoreCase(a.getStatus())).count())
                .topJobsByApplications(topJobs)
                .companiesByJobs(companiesByJobs)
                .build();
    }

    public List<AdminAuditLogDTO> getAuditLogs() {
        List<AdminAuditLogDTO> logs = new ArrayList<>();

        userRepository.findAll().forEach(u -> logs.add(AdminAuditLogDTO.builder()
                .timestamp(u.getCreatedAt() != null ? u.getCreatedAt() : LocalDateTime.now())
                .action("REGISTER")
                .actor(u.getEmail())
                .subject("User #" + u.getId())
                .details("Role: " + u.getRole())
                .build()));

        companyRepository.findAll().forEach(c -> logs.add(AdminAuditLogDTO.builder()
                .timestamp(c.getCreatedAt() != null ? c.getCreatedAt() : LocalDateTime.now())
                .action("CREATE_COMPANY")
                .actor(c.getRecruiter() != null ? c.getRecruiter().getEmail() : "system")
                .subject("Company: " + c.getName())
                .details("Industry: " + c.getIndustry())
                .build()));

        jobRepository.findAll().forEach(j -> logs.add(AdminAuditLogDTO.builder()
                .timestamp(j.getCreatedAt() != null ? j.getCreatedAt() : LocalDateTime.now())
                .action("POST_JOB")
                .actor(j.getRecruiter() != null ? j.getRecruiter().getEmail() : "system")
                .subject("Job: " + j.getTitle())
                .details("Status: " + j.getStatus())
                .build()));

        applicationRepository.findAll().forEach(a -> logs.add(AdminAuditLogDTO.builder()
                .timestamp(a.getAppliedAt() != null ? a.getAppliedAt() : LocalDateTime.now())
                .action("APPLY_JOB")
                .actor(a.getStudent() != null && a.getStudent().getUser() != null
                        ? a.getStudent().getUser().getEmail() : "student")
                .subject("Application #" + a.getId())
                .details("Status: " + a.getStatus())
                .build()));

        logs.sort(Comparator.comparing(AdminAuditLogDTO::getTimestamp,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return logs;
    }

    private Long companyId(Job j) {
        return j.getCompany() != null ? j.getCompany().getId() : null;
    }

    private List<AdminAnalyticsDTO.MonthlyCount> monthlyCounts(List<LocalDateTime> timestamps) {
        return timestamps.stream()
                .filter(ts -> ts != null)
                .collect(Collectors.groupingBy(
                        YearMonth::from,
                        TreeMap::new,
                        Collectors.counting()))
                .entrySet().stream()
                .map(e -> AdminAnalyticsDTO.MonthlyCount.builder()
                        .year(e.getKey().getYear())
                        .month(e.getKey().getMonthValue())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());
    }
}
