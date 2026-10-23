package com.placement.controller;

import com.placement.dto.CompanyRequest;
import com.placement.dto.CompanyResponse;
import com.placement.service.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Company management endpoints.
 * - Recruiter scoped CRUD under /api/recruiters/companies
 * - Read-only public listing under /api/companies (authenticated)
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Company", description = "Company management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class CompanyController {

    private final CompanyService companyService;

    // ---------- Recruiter CRUD ----------

    @PostMapping("/api/recruiters/companies")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    @Operation(summary = "Create a company (recruiter owned)")
    public ResponseEntity<CompanyResponse> createCompany(@Valid @RequestBody CompanyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(companyService.createCompany(request));
    }

@GetMapping("/api/recruiters/companies")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    @Operation(summary = "List companies owned by the current recruiter")
    public ResponseEntity<List<CompanyResponse>> getMyCompanies() {
        return ResponseEntity.ok(companyService.getMyCompanies());
    }

    @GetMapping("/api/recruiters/companies/me")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    @Operation(summary = "Get the current recruiter's primary company (or 404 if none)")
    public ResponseEntity<CompanyResponse> getMyCompany() {
        CompanyResponse company = companyService.getMyCompany();
        if (company == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(company);
    }

    @GetMapping("/api/recruiters/companies/{id}")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    @Operation(summary = "Get a company owned by the recruiter")
    public ResponseEntity<CompanyResponse> getCompany(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.getCompany(id));
    }

    @PutMapping("/api/recruiters/companies/{id}")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    @Operation(summary = "Update a company owned by the recruiter")
    public ResponseEntity<CompanyResponse> updateCompany(@PathVariable Long id,
            @Valid @RequestBody CompanyRequest request) {
        return ResponseEntity.ok(companyService.updateCompany(id, request));
    }

    @DeleteMapping("/api/recruiters/companies/{id}")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    @Operation(summary = "Delete a company owned by the recruiter")
    public ResponseEntity<Void> deleteCompany(@PathVariable Long id) {
        companyService.deleteCompany(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Public listing for dropdowns ----------

    @GetMapping("/api/companies")
    @PreAuthorize("hasAnyRole('STUDENT', 'RECRUITER', 'ADMIN')")
    @Operation(summary = "List all companies (for dropdowns and job browsing)")
    public ResponseEntity<List<CompanyResponse>> getAllCompanies() {
        return ResponseEntity.ok(companyService.getAllCompanies());
    }
}
