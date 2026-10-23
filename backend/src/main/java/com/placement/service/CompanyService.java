package com.placement.service;

import com.placement.dto.CompanyRequest;
import com.placement.dto.CompanyResponse;
import com.placement.entity.Company;
import com.placement.entity.User;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.CompanyRepository;
import com.placement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for company management with recruiter ownership rules.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final MapperService mapperService;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Company findOwnedCompany(Long id) {
        User recruiter = getCurrentUser();
        return companyRepository.findByIdAndRecruiter(id, recruiter)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found or not owned by you"));
    }

    /**
     * Recruiter creates a company owned by them.
     */
    public CompanyResponse createCompany(CompanyRequest request) {
        User recruiter = getCurrentUser();
        companyRepository.findByNameIgnoreCase(request.getName()).ifPresent(c -> {
            throw new IllegalArgumentException("Company with this name already exists");
        });

        Company company = mapperService.applyRequest(null, request, recruiter);
        company.setCreatedAt(LocalDateTime.now());
        Company saved = companyRepository.save(company);
        log.info("Recruiter {} created company {}", recruiter.getEmail(), saved.getId());
        return mapperService.companyToResponse(saved);
    }

/**
     * Recruiter lists their owned companies.
     */
    @Transactional(readOnly = true)
    public List<CompanyResponse> getMyCompanies() {
        User recruiter = getCurrentUser();
        return companyRepository.findByRecruiter(recruiter).stream()
                .map(mapperService::companyToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Return the recruiter's primary company (first owned company), or null if none.
     * Used by the Company Profile page.
     */
    @Transactional(readOnly = true)
    public CompanyResponse getMyCompany() {
        User recruiter = getCurrentUser();
        return companyRepository.findByRecruiter(recruiter).stream()
                .findFirst()
                .map(mapperService::companyToResponse)
                .orElse(null);
    }

    /**
     * Public listing of all companies (for dropdowns/job browsing).
     */
    @Transactional(readOnly = true)
    public List<CompanyResponse> getAllCompanies() {
        return companyRepository.findAll().stream()
                .map(mapperService::companyToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Recruiter fetches one of their owned companies.
     */
    @Transactional(readOnly = true)
    public CompanyResponse getCompany(Long id) {
        return mapperService.companyToResponse(findOwnedCompany(id));
    }

    /**
     * Recruiter updates one of their owned companies.
     */
    public CompanyResponse updateCompany(Long id, CompanyRequest request) {
        Company company = findOwnedCompany(id);
        mapperService.applyRequest(company, request, getCurrentUser());
        Company saved = companyRepository.save(company);
        return mapperService.companyToResponse(saved);
    }

    /**
     * Recruiter deletes one of their owned companies.
     */
    public void deleteCompany(Long id) {
        Company company = findOwnedCompany(id);
        companyRepository.delete(company);
        log.info("Deleted company {}", id);
    }
}
