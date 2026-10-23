package com.placement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Company representation for admin company management.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCompanyDTO {
    private Long id;
    private String name;
    private String industry;
    private String location;
    private String website;
    private String description;
    private String logo;
    private LocalDateTime createdAt;
    private String recruiterEmail;
    private long jobCount;
}
