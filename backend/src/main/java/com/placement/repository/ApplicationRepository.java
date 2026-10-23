package com.placement.repository;

import com.placement.entity.Application;
import com.placement.entity.Job;
import com.placement.entity.StudentProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByStudent(StudentProfile student);

    boolean existsByStudentIdAndJobId(Long studentId, Long jobId);

    long countByJobId(Long jobId);

    Optional<Application> findByIdAndStudentId(Long id, Long studentId);

// Recruiter-facing queries
    List<Application> findByJobIn(List<Job> jobs);

    Page<Application> findByJobIn(List<Job> jobs, Pageable pageable);

    Page<Application> findByJobIdAndJobIn(Long jobId, List<Job> jobs, Pageable pageable);

    // Recruiter-facing queries with status filter (server-side pagination)
    Page<Application> findByJobInAndStatus(List<Job> jobs, String status, Pageable pageable);

    Page<Application> findByJobIdAndJobInAndStatus(Long jobId, List<Job> jobs, String status, Pageable pageable);
}
