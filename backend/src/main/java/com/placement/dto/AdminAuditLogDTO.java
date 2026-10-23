package com.placement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Audit log entry for the admin Audit Logs page.
 * Since no dedicated audit table exists, this is derived from sourcing
 * entities (users, companies, jobs, applications) for a lightweight trail.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAuditLogDTO {
    private LocalDateTime timestamp;
    private String action;
    private String actor;
    private String subject;
    private String details;
}
