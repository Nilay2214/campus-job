package com.placement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "student_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    private String fullName;
    private String phone;
    private String department;
    private String branch;
    private String cgpa;
    private String resumeUrl;
    private String skills;
    private String graduationYear;
    private String linkedInUrl;
    private String githubUrl;
    private String portfolioUrl;
    private String address;
    private String aboutMe;
}
