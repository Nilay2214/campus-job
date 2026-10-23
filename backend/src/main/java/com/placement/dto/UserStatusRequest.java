package com.placement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for PATCH /api/admin/users/{id}/status.
 * Only the {@code enabled} flag is accepted; role is never touched here
 * (prevents any role escalation via this endpoint).
 */
@Data
public class UserStatusRequest {
    @NotNull(message = "enabled is required")
    private Boolean enabled;
}
