package com.placement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * One-time, expiring password reset token.
 *
 * <p>Security notes:
 * <ul>
 *   <li>The raw token is only ever returned to the caller notification path; the DB stores a
 *       SHA-256 hash so a DB leak does not expose usable reset tokens.</li>
 *   <li>Tokens are single-use and expire after a configurable window.</li>
 *   <li>Tokens are never logged.</li>
 * </ul>
 */
@Entity
@Table(name = "password_reset_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime expiry;

    @Column(nullable = false)
    @Builder.Default
    private boolean used = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
