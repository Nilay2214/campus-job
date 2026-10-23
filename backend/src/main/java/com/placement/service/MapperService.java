package com.placement.service;

import com.placement.dto.ApplicationDTO;
import com.placement.dto.CompanyDTO;
import com.placement.dto.CompanyDetailDTO;
import com.placement.dto.CompanyRequest;
import com.placement.dto.CompanyResponse;
import com.placement.dto.JobDTO;
import com.placement.dto.JobDetailDTO;
import com.placement.entity.Application;
import com.placement.entity.Company;
import com.placement.entity.Job;
import com.placement.entity.StudentProfile;
import com.placement.entity.User;
import org.springframework.stereotype.Service;

@Service
public class MapperService {

    public JobDTO jobToDTO(Job job) {
        if (job == null) {
            return null;
        }

        return JobDTO.builder()
            .id(job.getId())
            .title(job.getTitle())
            .description(job.getDescription())
            .requiredSkills(job.getRequiredSkills())
            .salaryMin(job.getSalaryMin())
            .salaryMax(job.getSalaryMax())
            .location(job.getLocation())
            .employmentType(job.getEmploymentType())
            .workMode(job.getWorkMode())
            .experience(job.getExperience())
            .deadline(job.getDeadline())
            .status(job.getStatus())
            .createdAt(job.getCreatedAt())
            .company(companyToDTO(job.getCompany()))
            .build();
    }

    public JobDetailDTO jobToDetailDTO(Job job) {
        if (job == null) {
            return null;
        }

        return JobDetailDTO.builder()
            .id(job.getId())
            .title(job.getTitle())
            .description(job.getDescription())
            .eligibility(job.getEligibility())
            .requiredSkills(job.getRequiredSkills())
            .salaryMin(job.getSalaryMin())
            .salaryMax(job.getSalaryMax())
            .location(job.getLocation())
            .employmentType(job.getEmploymentType())
            .workMode(job.getWorkMode())
            .experience(job.getExperience())
            .deadline(job.getDeadline())
            .status(job.getStatus())
            .createdAt(job.getCreatedAt())
            .updatedAt(job.getUpdatedAt())
            .company(companyToDetailDTO(job.getCompany()))
            .build();
    }

    public CompanyDTO companyToDTO(Company company) {
        if (company == null) {
            return null;
        }

        return CompanyDTO.builder()
            .id(company.getId())
            .name(company.getName())
            .logo(company.getLogo())
            .location(company.getLocation())
            .build();
    }

public CompanyDetailDTO companyToDetailDTO(Company company) {
        if (company == null) {
            return null;
        }

        return CompanyDetailDTO.builder()
            .id(company.getId())
            .name(company.getName())
            .industry(company.getIndustry())
            .website(company.getWebsite())
            .location(company.getLocation())
            .description(company.getDescription())
            .logo(company.getLogo())
            .createdAt(company.getCreatedAt())
            .build();
    }

    public CompanyResponse companyToResponse(Company company) {
        if (company == null) {
            return null;
        }

        return CompanyResponse.builder()
            .id(company.getId())
            .name(company.getName())
            .industry(company.getIndustry())
            .website(company.getWebsite())
            .location(company.getLocation())
            .description(company.getDescription())
            .logo(company.getLogo())
            .createdAt(company.getCreatedAt())
            .recruiterEmail(company.getRecruiter() != null ? company.getRecruiter().getEmail() : null)
            .build();
    }

    public Company applyRequest(Company company, CompanyRequest request, User recruiter) {
        if (company == null) {
            company = new Company();
        }
        company.setName(request.getName());
        company.setIndustry(request.getIndustry());
        company.setWebsite(request.getWebsite());
        company.setLocation(request.getLocation());
        company.setDescription(request.getDescription());
        company.setLogo(request.getLogo());
if (recruiter != null) {
            company.setRecruiter(recruiter);
        }
        return company;
    }

    public ApplicationDTO applicationToDTO(Application application) {
        if (application == null) {
            return null;
        }

        Job job = application.getJob();
        StudentProfile student = application.getStudent();

        Company company = job != null ? job.getCompany() : null;
        User studentUser = student != null ? student.getUser() : null;

        return ApplicationDTO.builder()
            .id(application.getId())
            .status(application.getStatus())
            .appliedAt(application.getAppliedAt())
            // Job snapshot
            .jobId(job != null ? job.getId() : null)
            .jobTitle(job != null ? job.getTitle() : null)
            .jobLocation(job != null ? job.getLocation() : null)
            .jobEmploymentType(job != null ? job.getEmploymentType() : null)
            .jobWorkMode(job != null ? job.getWorkMode() : null)
            .jobExperience(job != null ? job.getExperience() : null)
            .jobSalaryMin(job != null ? job.getSalaryMin() : null)
            .jobSalaryMax(job != null ? job.getSalaryMax() : null)
            .jobStatus(job != null ? job.getStatus() : null)
            .companyName(company != null ? company.getName() : null)
            // Student snapshot
            .studentId(student != null ? student.getId() : null)
            .studentName(student != null ? student.getFullName() : null)
            .studentEmail(studentUser != null ? studentUser.getEmail() : null)
            .studentPhone(student != null ? student.getPhone() : null)
            .studentBranch(student != null ? student.getBranch() : null)
            .studentCgpa(student != null ? student.getCgpa() : null)
            .studentSkills(student != null ? student.getSkills() : null)
            .studentResumeUrl(student != null ? student.getResumeUrl() : null)
            .build();
    }
}
