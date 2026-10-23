package com.placement.repository;

import com.placement.entity.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {
    List<Job> findByStatusOrderByCreatedAtDesc(String status);
    List<Job> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    // Recruiter-scoped pageable queries (database-level pagination)
    // Uses existing entity relationship: Job.recruiter (ManyToOne -> User)
    // Support recruiter.id and optional status/title filters.

    // Optional status (exact match) + recruiter + pagination
    Page<Job> findAllByRecruiter_IdAndStatusOrderByCreatedAtDesc(Long recruiterId, String status, Pageable pageable);

    // Optional status + title contains (case-insensitive) + recruiter + pagination
    Page<Job> findAllByRecruiter_IdAndStatusAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(
            Long recruiterId,
            String status,
            String title,
            Pageable pageable
    );

    // No status filter + optional title contains + recruiter + pagination
    Page<Job> findAllByRecruiter_IdAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(
            Long recruiterId,
            String title,
            Pageable pageable
    );

// No filters (recruiter only) + pagination
    Page<Job> findAllByRecruiter_IdOrderByCreatedAtDesc(Long recruiterId, Pageable pageable);

    // Recruiter-scoped list (used by RecruiterApplicationService to avoid loading ALL jobs
    // into memory and filtering in Java). Returns only jobs owned by the given recruiter.
    List<Job> findByRecruiter_Id(Long recruiterId);


}


