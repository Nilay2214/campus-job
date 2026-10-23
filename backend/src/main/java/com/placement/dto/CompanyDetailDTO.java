package com.placement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyDetailDTO {
    private Long id;
    private String name;
    private String industry;
    private String website;
    private String location;
    private String description;
    private String logo;
    private LocalDateTime createdAt;
}
