package com.placement.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for a Company, including recruiter ownership info.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Company response payload")
public class CompanyResponse {

    @Schema(description = "Company ID", example = "1")
    private Long id;

    @Schema(description = "Company name", example = "Acme Corp")
    private String name;

    @Schema(description = "Company industry", example = "Information Technology")
    private String industry;

    @Schema(description = "Company website URL", example = "https://acme.com")
    private String website;

    @Schema(description = "Company headquarters location", example = "Bengaluru, India")
    private String location;

    @Schema(description = "Company description")
    private String description;

    @Schema(description = "Company logo URL", example = "https://acme.com/logo.png")
    private String logo;

    @Schema(description = "Company creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Email of the recruiter owner, if any")
    private String recruiterEmail;
}
