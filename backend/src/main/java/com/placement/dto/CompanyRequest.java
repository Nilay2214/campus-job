package com.placement.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating/updating a Company.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for creating or updating a company")
public class CompanyRequest {

    @NotBlank(message = "Company name is required")
    @Size(max = 200, message = "Company name must be at most 200 characters")
    @Schema(description = "Company name", example = "Acme Corp")
    private String name;

    @Size(max = 120, message = "Industry must be at most 120 characters")
    @Schema(description = "Company industry", example = "Information Technology")
    private String industry;

    @Size(max = 255, message = "Website must be at most 255 characters")
    @Schema(description = "Company website URL", example = "https://acme.com")
    private String website;

    @Size(max = 200, message = "Location must be at most 200 characters")
    @Schema(description = "Company headquarters location", example = "Bengaluru, India")
    private String location;

    @Size(max = 2000, message = "Description must be at most 2000 characters")
    @Schema(description = "Company description")
    private String description;

    @Size(max = 500, message = "Logo URL must be at most 500 characters")
    @Schema(description = "Company logo URL", example = "https://acme.com/logo.png")
    private String logo;
}
