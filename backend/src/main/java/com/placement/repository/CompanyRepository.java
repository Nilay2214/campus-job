package com.placement.repository;

import com.placement.entity.Company;
import com.placement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    List<Company> findByRecruiter(User recruiter);
    Optional<Company> findByIdAndRecruiter(Long id, User recruiter);
    Optional<Company> findByNameIgnoreCase(String name);

    /**
     * Batch job-count per company, avoiding an N+1 query pattern.
     * Returns row arrays of [companyId, jobCount].
     */
    @Query("select j.company.id, count(j) from Job j where j.company is not null group by j.company.id")
    List<Object[]> countJobsPerCompany();
}
