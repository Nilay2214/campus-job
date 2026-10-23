package com.placement.specification;

import com.placement.dto.JobSearchCriteria;
import com.placement.entity.Job;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class JobSpecification {

    public static Specification<Job> getJobsByCriteria(JobSearchCriteria criteria) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Title search
            if (criteria.getTitle() != null && !criteria.getTitle().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("title")),
                    "%" + criteria.getTitle().toLowerCase() + "%"
                ));
            }

            // Location filter
            if (criteria.getLocation() != null && !criteria.getLocation().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("location")),
                    "%" + criteria.getLocation().toLowerCase() + "%"
                ));
            }

            // Salary range filter
            if (criteria.getSalaryMin() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                    root.get("salaryMin"),
                    criteria.getSalaryMin()
                ));
            }

            if (criteria.getSalaryMax() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                    root.get("salaryMax"),
                    criteria.getSalaryMax()
                ));
            }

            // Required skills filter
            if (criteria.getRequiredSkills() != null && !criteria.getRequiredSkills().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("requiredSkills")),
                    "%" + criteria.getRequiredSkills().toLowerCase() + "%"
                ));
            }

            // Company filter
            if (criteria.getCompanyId() != null) {
                predicates.add(criteriaBuilder.equal(
                    root.get("company").get("id"),
                    criteria.getCompanyId()
                ));
            }

            // Employment type filter
            if (criteria.getEmploymentType() != null && !criteria.getEmploymentType().isEmpty()) {
                predicates.add(criteriaBuilder.equal(
                    root.get("employmentType"),
                    criteria.getEmploymentType()
                ));
            }

            // Work mode filter
            if (criteria.getWorkMode() != null && !criteria.getWorkMode().isEmpty()) {
                predicates.add(criteriaBuilder.equal(
                    root.get("workMode"),
                    criteria.getWorkMode()
                ));
            }

// Status filter (default to ACTIVE)
            if (criteria.getStatus() != null && !criteria.getStatus().isEmpty()) {
                predicates.add(criteriaBuilder.equal(
                    root.get("status"),
                    criteria.getStatus()
                ));

                // For ACTIVE jobs visible to students, only show those whose deadline
                // is either null or still in the future. Expired ACTIVE jobs are hidden
                // from student-facing listings, while recruiters/admins manage their own
                // jobs through separate recruiter-scoped repository queries.
                if ("ACTIVE".equalsIgnoreCase(criteria.getStatus())) {
                    predicates.add(criteriaBuilder.or(
                        criteriaBuilder.isNull(root.get("deadline")),
                        criteriaBuilder.greaterThanOrEqualTo(
                            root.get("deadline"),
                            LocalDateTime.now()
                        )
                    ));
                }
            } else {
                predicates.add(criteriaBuilder.equal(
                    root.get("status"),
                    "ACTIVE"
                ));

                // Default student listing: only show ACTIVE jobs with a null or future deadline.
                predicates.add(criteriaBuilder.or(
                    criteriaBuilder.isNull(root.get("deadline")),
                    criteriaBuilder.greaterThanOrEqualTo(
                        root.get("deadline"),
                        LocalDateTime.now()
                    )
                ));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
