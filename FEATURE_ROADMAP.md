# FEATURE ROADMAP — Production-Ready Architecture for Future Features

**Project:** Campus Job
**Stack:** Java 17 + Spring Boot 3.2.5 + Spring Security + JWT + JPA/Hibernate + MySQL + H2 tests + Maven; React + Vite + Axios + React Router + Tailwind

This document defines the clean, production-ready architecture for features that are currently **absent**. None of these are implemented or faked in the codebase. They are documented here so they can be built safely and completely later without breaking the existing, verified functionality.

---

## 1. Google Authentication (OAuth2 / OIDC)

**Status:** Not implemented (feature gap).

### Frontend changes
- Add a "Continue with Google" button on `LoginPage.jsx` (must perform a real OAuth2 flow — never a no-op button).
- Redirect to backend `/oauth2/authorization/google`.
- On success the backend issues a JWT; store it exactly as the existing login flow does (`localStorage` `token`/`role`).
- Add a route/guard for the OAuth callback if a frontend page is needed.

### Backend changes
- Add Spring Security OAuth2 Client dependency (`spring-boot-starter-oauth2-client`).
- Configure `spring.security.oauth2.client.registration.google` + `provider.google` in `application-prod.properties` (values from env vars only).
- Add a custom `OAuth2UserService` (or `OAuth2User` mapper) that maps the Google profile to the existing `User` entity (email, name → fullName, `STUDENT` role by default), and issues a JWT via the existing `JwtUtil`.
- Add a success handler that returns the JWT to the frontend (redirect with token or a callback endpoint).

### Database changes
- No structural change required (email is already unique on `users`). Consider adding `provider` + `provider_id` columns if you want to distinguish OAuth vs local accounts and handle linked identities.

### Dependencies
- `spring-boot-starter-oauth2-client`, `spring-security-oauth2-jose`.

### Environment variables
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (required, fail-fast in `EnvConfigValidator`), `GOOGLE_REDIRECT_URI`.

### Security considerations
- Never hardcode client secret.
- Validate the ID token audience/issuer; use server-side code exchange (Authorization Code + PKCE), never an implicit/native token.
- Enforce HTTPS in production.
- Reuse the existing authorization/RBAC (`ROLE_STUDENT/RECRUITER/ADMIN`) after authentication.

### API endpoints
- `GET /oauth2/authorization/google` (redirect), `GET /login/oauth2/code/google` (callback), `GET /api/auth/oauth/success` (optional JWT delivery).

### Token expiration
- Reuse the existing `app.jwt.expiration-ms`.

### Rate limiting / abuse prevention
- Reuse the existing registration rate limiter (`LoginAttemptService`) for newly-created OAuth accounts.
- Reject OAuth accounts whose email already exists but with a different provider (unless a verified link flow is implemented).

### Testing strategy
- Mock the OAuth2 provider in `@WebMvcTest`/unit tests; verify JWT issuance and role assignment.
- Live test against a real Google test tenant (manual/OAuth consent).

### Production deployment requirements
- Registered redirect URI, verified domain, HTTPS, secrets in the deployment environment (not committed).

---

## 2. Email OTP Verification

**Status:** Not implemented (feature gap).

### Frontend changes
- Add an email-verification step to `RegisterPage.jsx` (send OTP → enter OTP → confirm).
- Add a "Resend code" action with a cooldown timer.
- Show inline success/error states.

### Backend changes
- Add `OtpService` that generates a random 6-digit numeric OTP and stores it **hashed** (e.g. SHA-256) with an expiry timestamp and attempt counter — never store plaintext.
- Add `POST /api/auth/otp/send` and `POST /api/auth/otp/verify`.
- Add a `MailService` that sends the OTP via the existing (currently unused) SMTP config; it must **fail gracefully** (log + return a generic error) when SMTP is not configured, without pretending an email was sent.
- Wire the `User.enabled` flag: a user is `enabled=false` until the OTP is verified (respecting the existing disabled-account login block).

### Database changes
- Add an `otp_codes` table: `id`, `user_id`, `email`, `code_hash`, `expires_at`, `attempts`, `created_at`. No plaintext OTPs.

### Dependencies
- Spring Mail (`spring-boot-starter-mail`) — already on the classpath/config; no new dependency strictly required.

### Environment variables
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` (already present in `application.properties`; the app currently leaves them blank/disabled).

### Security considerations
- Store only hashes; one-time use; expiry (e.g. 5–10 min); max attempts (e.g. 5) then invalidate; rate-limit resend (e.g. 60s) and per-email send (reuse `LoginAttemptService`).
- Do not reveal whether an email is registered on the send endpoint (generic response).
- Never expose the OTP in logs or API responses.

### API endpoints
- `POST /api/auth/otp/send`, `POST /api/auth/otp/verify`.

### Token expiration
- OTP lifetime bounded by `expires_at`; after verification it is invalidated.

### Rate limiting / abuse prevention
- Reuse/in-memory or DB-backed rate limits for send and verify; lock out after repeated failures.

### Testing strategy
- Unit tests for hashing, expiry, attempt limits, one-time use.
- H2 integration test for the send/verify flow with a mocked mail sender.
- Live test against a real SMTP account (manual).

### Production deployment requirements
- Real SMTP credentials via env, verified sender domain (SPF/DKIM), queue for outbound mail to avoid blocking the request thread.

---

## 3. Mobile / Phone OTP Verification

**Status:** Not implemented (feature gap).

### Frontend changes
- Add a phone field + "Send OTP" / "Verify OTP" flow to the profile or registration page.
- Reuse the same OTP UI component as email OTP.

### Backend changes
- Add `SmsService` abstraction (interface) with a stub/logging default and a real provider implementation (e.g. Twilio) behind a feature flag.
- Reuse the same `OtpService` (generic target: email or phone) — store hashed code keyed by target value.
- Add `POST /api/auth/sms-otp/send` and `POST /api/auth/otp/verify` (already generic).

### Database changes
- Add `phone` (already exists on `StudentProfile`) and optionally `phone_verified` boolean + `otp_codes.target` column to distinguish email vs phone.

### Dependencies
- Twilio SDK (or provider of choice) — **not yet added**.

### Environment variables
- `SMS_PROVIDER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.

### Security considerations
- Same as email OTP: hash-only storage, expiry, attempt limits, rate limiting, generic send responses to prevent phone-number enumeration.
- Validate phone format (10-digit per existing `StudentProfileRequest` pattern).

### API endpoints
- `POST /api/auth/sms-otp/send`, `POST /api/auth/otp/verify`.

### Token expiration
- Same OTP expiry policy.

### Rate limiting / abuse prevention
- Reuse OTP rate limiter; cap per-target and per-IP.

### Testing strategy
- Unit tests for OTP lifecycle; integration test with a mocked SMS provider; live test with a real provider (manual).

### Production deployment requirements
- Provider credentials via env, cost controls (per-number send caps), compliance (carrier/consent where applicable).

---

## 4. Password Reset

**Status:** IMPLEMENTED (backend + frontend + regression tests). Email delivery is an abstraction (no-op with logging when SMTP is unconfigured; real send when credentials are configured).

### Implemented
- **Backend**
  - Entity `PasswordResetToken` (`password_reset_tokens`): stores only a SHA-256 hash of the token, `expires_at`, `used` flag, `created_at`.
  - Repository `PasswordResetTokenRepository`.
  - DTOs `ForgotPasswordRequest` (email) and `ResetPasswordRequest` (token + newPassword).
  - `EmailService` abstraction: no-op/logging default; real SMTP send when `MAIL_USERNAME`/`MAIL_PASSWORD` are configured.
  - `AuthService.requestPasswordReset()` — generates a cryptographically-secure token, stores only the hash with expiry (default 30 min, configurable via `app.auth.password-reset.token-expiry-minutes`), and sends the reset token via `EmailService`. Returns a generic response to prevent user enumeration.
  - `AuthService.resetPassword()` — validates hash + expiry + single-use, re-encodes the new password with the existing `PasswordEncoder`, invalidates the token.
  - Controller endpoints:
    - `POST /api/auth/forgot-password`
    - `POST /api/auth/reset-password`
- **Frontend**
  - `authService.js` (`requestPasswordReset`, `resetPassword`).
  - `ForgotPasswordPage.jsx` (email → token request, generic success state).
  - `ResetPasswordPage.jsx` (token + new password + confirm; reads `?token=` from the URL).
  - Wired into `App.jsx` (`/forgot-password`, `/reset-password`) and a "Forgot password?" link on `LoginPage.jsx`.

### Security considerations
- Only hashed tokens stored; one-time use; expiry; generic request response (no email enumeration); no token printed to logs.
- Force re-login after reset is not implemented (no JWT token-version mechanism); existing JWTs remain valid until expiry. This is a documented, acceptable limitation.

### Testing
- Unit tests in `AuthServiceTest` for request (hash stored, generic response) and reset (valid token success, expired/invalid token rejection, single-use invalidation).

### Production deployment requirements
- Real SMTP credentials via env, `APP_BASE_URL` for the reset link, HTTPS for the reset link, and a token cleanup job for expired rows.

---

## 5. Transactional Email Sending

**Status:** Config present; no mail service implemented.

### Frontend changes
- None required (emails are triggered server-side).

### Backend changes
- Add a `MailService` component that builds and sends HTML emails (verification, password reset, application status notifications) through the existing SMTP config.
- It must be disabled/fail-soft when `MAIL_USERNAME`/`MAIL_PASSWORD` are blank (current default), so existing workflows are unaffected.

### Database changes
- Optional `outbound_emails` log table (id, to, subject, status, sent_at) for auditability.

### Dependencies
- `spring-boot-starter-mail` (already on classpath).

### Environment variables
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `APP_BASE_URL`.

### Security considerations
- Never log message content containing secrets/OTPs/tokens; sanitize recipient; HTML-escape user content.

### API endpoints
- Internal service only (no public endpoint).

### Token expiration
- N/A (emails carry OTP/reset tokens governed above).

### Rate limiting / abuse prevention
- Enforce send-rate limits to avoid being blacklisted.

### Testing strategy
- Unit tests with a mocked `JavaMailSender`; integration test for template rendering.

### Production deployment requirements
- Verified sender domain, SPF/DKIM/DMARC, outbound queue, monitoring.

---

## 6. Admin Enable/Disable User HTTP Endpoint

**Status:** IMPLEMENTED (backend + frontend + regression tests).

### Implemented
- **Backend**
  - DTO `UserStatusRequest` (`{enabled: boolean}`).
  - `AdminService.updateUserStatus(Long userId, UserStatusRequest)` flips `User.enabled`; the existing `CustomUserDetailsService` rejects disabled accounts at login (verified).
  - `AdminController` endpoint `PATCH /api/admin/users/{id}/status` guarded by `@PreAuthorize("hasRole('ADMIN')")` (and `/api/admin/**` → ADMIN in `SecurityConfig`).
- **Frontend**
  - `adminService.updateUserStatus(userId, enabled)`.
  - `ManageUsers.jsx` — enable/disable toggle button with confirmation modal, Actions column.

### Security considerations
- Admin-only; prevents an admin from disabling themselves (business rule); the action is audited.

### Testing
- `AdminServiceTest` regression tests for the status toggle.

### Production deployment requirements
- Audit logging, admin role guard already enforced by `SecurityConfig` (`/api/admin/**` → ADMIN).

---

### Cross-cutting notes
- **No fake implementations:** none of the above are added to the running app. The existing `MAIL_*` config stays blank/disabled and the app continues to work without SMTP.
- **No OTPs in plaintext, no OAuth secrets in code, no "email sent" fakery.**
- Every feature above reuses the existing entities, `JwtUtil`, `PasswordEncoder`, `LoginAttemptService` rate limiting, and `SecurityConfig` RBAC so behavior stays consistent and secure.
