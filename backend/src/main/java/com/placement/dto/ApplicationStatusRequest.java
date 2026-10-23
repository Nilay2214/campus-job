package com.placement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request payload for updating an application's status.
 */
@Data
public class ApplicationStatusRequest {
    @NotBlank
    private String status;
}
