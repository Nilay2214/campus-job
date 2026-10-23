package com.placement.repository;

import com.placement.entity.MobileOtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface MobileOtpTokenRepository extends JpaRepository<MobileOtpToken, Long> {

    Optional<MobileOtpToken> findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc(String phoneNumber);

    long countByPhoneNumberAndCreatedAtAfter(String phoneNumber, LocalDateTime windowStart);
}
