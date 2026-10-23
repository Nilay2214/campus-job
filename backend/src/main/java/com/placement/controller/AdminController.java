package com.placement.controller;

import com.placement.dto.AdminAnalyticsDTO;
import com.placement.dto.AdminAuditLogDTO;
import com.placement.dto.AdminCompanyDTO;
import com.placement.dto.AdminDashboardStatsDTO;
import com.placement.dto.AdminReportDTO;
import com.placement.dto.AdminUserDTO;
import com.placement.dto.UserStatusRequest;
import com.placement.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin", description = "Administrative endpoints. Requires a valid JWT token with ADMIN role.")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    @Operation(summary = "Admin dashboard statistics",
            description = "Returns aggregated platform statistics for the admin dashboard.")
    public ResponseEntity<AdminDashboardStatsDTO> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

@GetMapping("/users")
    @Operation(summary = "List all users",
            description = "Returns the list of all registered users.")
    public ResponseEntity<List<AdminUserDTO>> listUsers() {
        return ResponseEntity.ok(adminService.listUsers());
    }

    @PatchMapping("/users/{id}/status")
    @Operation(summary = "Enable or disable a user account",
            description = "ADMIN-only. Updates only the enabled flag. Role is never changed here, so this endpoint cannot be used to escalate privileges.")
    public ResponseEntity<AdminUserDTO> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UserStatusRequest request) {
        return ResponseEntity.ok(adminService.updateUserStatus(id, Boolean.TRUE.equals(request.getEnabled())));
    }

@GetMapping("/companies")
    @Operation(summary = "List all companies",
            description = "Returns the list of all companies with job counts.")
    public ResponseEntity<List<AdminCompanyDTO>> listCompanies() {
        return ResponseEntity.ok(adminService.listCompanies());
    }

    @GetMapping("/analytics")
    @Operation(summary = "Platform analytics",
            description = "Returns aggregated analytics for charts on the admin analytics page.")
    public ResponseEntity<AdminAnalyticsDTO> getAnalytics() {
        return ResponseEntity.ok(adminService.getAnalytics());
    }

    @GetMapping("/reports")
    @Operation(summary = "Platform reports",
            description = "Returns aggregated report summaries with top jobs and companies.")
    public ResponseEntity<AdminReportDTO> getReport() {
        return ResponseEntity.ok(adminService.getReport());
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Audit logs",
            description = "Returns a lightweight audit trail derived from sourcing entities.")
    public ResponseEntity<List<AdminAuditLogDTO>> getAuditLogs() {
        return ResponseEntity.ok(adminService.getAuditLogs());
    }
}
