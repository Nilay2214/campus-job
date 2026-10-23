# MASTER BUG REGISTER

**Project:** Campus Job
**Stack:** Java 17 + Spring Boot 3.2.5 + Spring Security + JWT + JPA/Hibernate + MySQL + H2 tests + Maven; React + Vite + Axios + React Router + Tailwind
**Audit Date:** 2026-08-09
**Status Legend:** ⬜ Open | ✅ Fixed | 🔵 Verified | ➖ Feature Gap

---

## P2 DATA INTEGRITY

### BUG-001 — Registration full name lost (P2, ✅ Fixed)
- **Component:** Auth (frontend `RegisterPage.jsx` → `RegisterRequest` → `User` → `AuthService.register()`)
- **Exact root cause:** Frontend collected `fullName` but `RegisterRequest` had no field, `User` had no `fullName` column, and `AuthService.register()` never persisted it — the name was silently discarded.
- **Reproduction:** Register a new student via the UI; the name never appears anywhere.
- **Affected files:** `RegisterRequest.java`, `User.java`, `AuthService.java`, `RegisterPage.jsx`, `AuthServiceTest.java`, `AuthRuntimeTest.java`.
- **Proposed fix:** Add `fullName` to DTO/entity, persist it in `register()`, send it from the frontend. Keep fullName lenient (optional) for backward compatibility — existing registrations/clients must not break. Also marked `User.password` `@JsonProperty(WRITE_ONLY)` so the BCrypt hash is never serialized.
- **Test required:** registration persists fullName; login still works; ADMIN self-registration still downgraded.
- **Live verification required:** REGISTER → LOGIN → GET PROFILE → verify fullName.
- **Status:** ✅ Fixed + 🔵 Verified.

### BUG-002 — Student profile data loss (P2, ✅ Fixed)
- **Component:** Student profile (`StudentProfile.jsx` → `StudentProfileRequest` → `StudentProfile` → `StudentService`)
- **Exact root cause:** Frontend sends `linkedInUrl`, `githubUrl`, `portfolioUrl`, `address`, `aboutMe` but the backend `StudentProfile` entity, `StudentProfileRequest` DTO, and `StudentService.saveOrUpdateProfile()` did not include these — they were silently dropped (no `FAIL_ON_UNKNOWN_PROPERTIES`).
- **Reproduction:** Fill the 5 extra fields in the profile form and save; on reload they are empty.
- **Affected files:** `StudentProfile.java`, `StudentProfileRequest.java`, `StudentService.java`, `StudentServiceTest.java`.
- **Proposed fix:** Add the 5 fields end-to-end; preserve existing fields (fullName, phone, department, branch, cgpa, resumeUrl, skills, graduationYear). Keep nullable/optional so existing data is preserved.
- **Test required:** create/update/read profile verifies every field.
- **Live verification required:** CREATE → UPDATE → GET → verify every field.
- **Status:** ✅ Fixed + 🔵 Verified.

### BUG-003 — Expired ACTIVE jobs still visible to students (P2, ✅ Fixed)
- **Component:** Job search (`JobSpecification` → `JobService.getAllJobs/getActiveJobs` → `StudentJobController`)
- **Exact root cause:** The specification filtered only `status = ACTIVE` and never considered `deadline`, so past-deadline jobs remained visible and applicable.
- **Reproduction:** Post an ACTIVE job with a deadline in the past; it still appears/applicable to students.
- **Affected files:** `JobSpecification.java`, `JobServiceTest.java`.
- **Proposed fix:** For ACTIVE student-facing listing, add `(deadline IS NULL OR deadline >= CURRENT_TIMESTAMP)`. Leave recruiter/admin job-management queries untouched (they use separate recruiter-scoped repository queries).
- **Test required:** ACTIVE+future → visible; ACTIVE+null → visible; ACTIVE+expired → hidden; CLOSED+future → hidden; other statuses → hidden.
- **Live verification required:** boundary cases against live MySQL.
- **Status:** ✅ Fixed + 🔵 Verified.

---

## P2 FUNCTIONAL

### BUG-004 — Recruiter ManageJobs company column blank (P2, ✅ Fixed)
- **Component:** Recruiter jobs (`RecruiterService.listJobs()` → `RecruiterJobController` → `ManageJobs.jsx` / `RecruiterDashboard.jsx`)
- **Exact root cause:** `RecruiterService.listJobs()` built `JobDTO` with `company(null)` instead of mapping the job's company, so the ManageJobs table and dashboard showed `—` for company.
- **Reproduction:** As a recruiter, list jobs; the company column/dashboard is blank.
- **Affected files:** `RecruiterService.java`, `RecruiterServiceTest.java`.
- **Proposed fix:** Set `mapperService.companyToDTO(j.getCompany())` (a lightweight CompanyDTO with id/name/logo/location — no heavy N+1; the job already holds a lazy company reference).
- **Test required:** recruiter job listing returns company name; cross-recruiter data remains protected.
- **Live verification required:** CREATE JOB → GET RECRUITER JOBS → verify company name.
- **Status:** ✅ Fixed + 🔵 Verified.

---

## P3 PERFORMANCE

### BUG-005 — Admin listCompanies N+1 query (P3, ✅ Fixed)
- **Component:** Admin (`AdminService.listCompanies()` → `CompanyRepository`)
- **Exact root cause:** `listCompanies()` called `jobRepository.findByCompanyIdOrderByCreatedAtDesc(c.getId()).size()` once **per company** → N+1.
- **Reproduction:** With many companies, listing companies triggers N job queries.
- **Affected files:** `CompanyRepository.java`, `AdminService.java`.
- **Proposed fix:** Add a single grouped JPQL query `SELECT j.company.id, COUNT(j) FROM Job j WHERE j.company IS NOT NULL GROUP BY j.company.id`; build a `Map<Long,Long>` and use `getOrDefault` for zero-job companies. Preserve exact response structure/values.
- **Test required:** multiple companies; companies with 0 jobs; companies with multiple jobs; exact counts.
- **Live verification required:** admin company listing returns correct job counts.
- **Status:** ✅ Fixed + 🔵 Verified.

---

## P3 RESUME

### BUG-006 — No resume DELETE endpoint (P3, ✅ Fixed)
- **Component:** Resume (`StudentService` → `StudentProfileController` → `resumeService.js`)
- **Exact root cause:** Frontend/client referenced resume deletion but the backend had no DELETE endpoint.
- **Reproduction:** Attempt to delete a resume → no route.
- **Affected files:** `FileStorageService.java`, `StudentService.java`, `StudentProfileController.java`, `resumeService.js`, `FileStorageServiceTest.java`, `StudentServiceTest.java`.
- **Proposed fix:** Add `DELETE /api/students/profile/resume` (class-level `@PreAuthorize("hasRole('STUDENT')")` → 204). Service finds the authenticated student's profile, clears the DB `resumeUrl`, and removes the physical file (safe if missing). Path-traversal-safe delete in `FileStorageService`. `/uploads/**` remains `denyAll`.
- **Test required:** owner → 204; no resume → safe; DB ref removed; physical file removed; missing file no-crash; other student → 403; recruiter → 403; anonymous → 401; path traversal rejected.
- **Live verification required:** verify_fix6_auth (7/7).
- **Status:** ✅ Fixed + 🔵 Verified.

---

## FEATURE GAPS (➖ not bugs — documented only)

### GAP-001 — Google Authentication (➖ Not implemented)
### GAP-002 — Email OTP verification (➖ Not implemented)
### GAP-003 — Mobile/phone OTP verification (➖ Not implemented)
### GAP-005 — Transactional email sending (➖ Config + EmailService abstraction present; real SMTP matching/HTML templates not implemented)

These are documented in `FEATURE_ROADMAP.md`. They are NOT bugs and were NOT fabricated.

---

## IMPLEMENTED FEATURES (formerly documented gaps)

### GAP-004 → IMPLEMENTED — Password reset (✅ backend + frontend + tests)
- **Component:** Auth (`AuthService` → `AuthController` → `PasswordResetToken`/`EmailService` → `ForgotPasswordPage`/`ResetPasswordPage`)
- **Implemented:**
  - Backend: `PasswordResetToken` entity (SHA-256 hash only), `PasswordResetTokenRepository`, `ForgotPasswordRequest`/`ResetPasswordRequest` DTOs, `EmailService` abstraction (no-op logging default; SMTP-send when configured), `AuthService.requestPasswordReset()` + `resetPassword()`, `AuthController` endpoints `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`.
  - Frontend: `authService.js`, `ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx`, routes `/forgot-password` + `/reset-password`, "Forgot password?" link on `LoginPage`.
- **Security:** SHA-256 hashed tokens, expiry (default 30 min), single-use, generic request response (no user enumeration), no token in logs.
- **Tests:** 10 new `AuthServiceTest` regression tests (114 total backend tests).
- **Live verification:** forgot-password returns generic message for unknown email; reset-password with invalid token returns HTTP 400.

### GAP-006 → IMPLEMENTED — Admin enable/disable user HTTP endpoint (✅ backend + frontend + tests)
- **Component:** Admin (`AdminService` → `AdminController` → `ManageUsers.jsx`)
- **Implemented:**
  - Backend: `UserStatusRequest` DTO, `AdminService.updateUserStatus(Long, UserStatusRequest)` flips `User.enabled`, `AdminController` `PATCH /api/admin/users/{id}/status` (ADMIN-only, `/api/admin/**` → ADMIN).
  - Frontend: `adminService.updateUserStatus`, `ManageUsers.jsx` enable/disable toggle + confirmation modal.
- **Security:** Admin-only; existing `CustomUserDetailsService` rejects disabled accounts at login (verified).
- **Tests:** `AdminServiceTest` regression tests.

---

## SECOND AUDIT — ADDITIONAL FINDINGS

### AUDIT-001 — Password hash exposed in API responses (P2, ✅ Fixed)
- **Root cause:** `User` entity serialized `password` (BCrypt hash) in responses.
- **Fix:** Added `@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)` on `User.password`.
- **Verification:** `verify_password_hidden.ps1` confirmed the hash no longer appears in the profile response.

### AUDIT-002 — Test-script false positive (disabled login) (P3, 🔵 Verified — not an app bug)
- **Root cause:** `security_live_test.ps1` SEC-C called a non-existent admin HTTP disable endpoint (404). The `enabled`/disabled mechanism works correctly (verified via `disabled_account_test.ps1` D1–D4).
- **Status:** No code change needed.

### AUDIT-009 — Recruiter application status filter applied client-side only (P3, ✅ Fixed)
- **Component:** Recruiter applications (`RecruiterApplications.jsx` → `RecruiterApplicationController` → `RecruiterApplicationService` → `ApplicationRepository`)
- **Exact root cause:** The status dropdown filtered the *current page's* rows entirely in the browser (`filteredApplications`), while pagination was server-side. With >1 page of applications, filtering by status could show an empty page or omit matching rows on later pages.
- **Reproduction:** As a recruiter with many applications across pages, filter by SHORTLISTED → only the current page is searched; results on other pages are missed.
- **Affected files:** `ApplicationRepository.java`, `RecruiterApplicationService.java`, `RecruiterApplicationController.java`, `RecruiterApplications.jsx`, `RecruiterApplicationServiceTest.java`.
- **Proposed fix:** Add `status` as a server-side query parameter. New repository queries `findByJobInAndStatus` and `findByJobIdAndJobInAndStatus` apply the status predicate before pagination. Service validates the status value and the controller forwards it. The frontend sends `status` in the params and no longer relies on client-side filtering.
- **Test required:** service unit tests for status-only, status+jobId, and no-status paths plus invalid-status rejection.
- **Live verification required:** GET `/api/recruiters/applications?status=SHORTLISTED` returns only SHORTLISTED across pages.
- **Status:** ✅ Fixed + 🔵 Verified (4 new regression tests, 104/104 backend tests pass).

### AUDIT-010 — Admin enable/disable user feature (P3, ✅ Implemented)
- **Component:** Admin (`AdminService` → `AdminController` → `ManageUsers.jsx`)
- **Root cause:** No HTTP endpoint existed to flip `User.enabled`; admins had to use the `DbHelper` utility.
- **Fix:** Added `UserStatusRequest` DTO, `AdminService.updateUserStatus()`, `PATCH /api/admin/users/{id}/status` (ADMIN-only), and a toggle + confirmation modal in `ManageUsers.jsx`.
- **Verification:** `AdminServiceTest` regression tests; disabled account still rejected at login by `CustomUserDetailsService`.

### AUDIT-011 — Password reset feature (P3, ✅ Implemented)
- **Component:** Auth (`AuthService` → `AuthController` → `PasswordResetToken`/`EmailService` → `ForgotPasswordPage`/`ResetPasswordPage`)
- **Root cause:** No password reset mechanism existed.
- **Fix:** Token-based reset with SHA-256 hashed, time-expiring, single-use tokens; `EmailService` abstraction (no-op/logging when SMTP unconfigured); `POST /api/auth/forgot-password` + `POST /api/auth/reset-password`; frontend pages + routes + login link.
- **Verification:** 10 new `AuthServiceTest` regression tests; live: forgot-password returns generic message (no enumeration), reset-password with invalid token returns HTTP 400.

---

## FINAL AUDIT — COMPREHENSIVE FINDINGS (BUG-007 .. BUG-015)

### BUG-007 — applyToJob ignores expired deadline (P1, ✅ Fixed + 🔵 Verified)
- **Component:** Applications (`ApplicationService.applyToJob`)
- **Exact root cause:** `applyToJob` only checked `if (!"ACTIVE".equals(job.getStatus()))` and omitted deadline checks, allowing students to apply to expired active jobs directly via API.
- **Reproduction:** Submit application to an ACTIVE job whose deadline passed.
- **Affected files:** `ApplicationService.java`, `ApplicationServiceTest.java`.
- **Fix:** Added `if (job.getDeadline() != null && job.getDeadline().isBefore(LocalDateTime.now())) { throw new BadRequestException("This job application deadline has passed"); }`.
- **Test:** `applyToJob_whenDeadlinePassed_throwsBadRequestException` in `ApplicationServiceTest`.
- **Status:** ✅ Fixed + 🔵 Verified.

### BUG-008 — getJobById returns non-ACTIVE/expired jobs to students (P1, ✅ Fixed + 🔵 Verified)
- **Component:** Jobs (`JobService.getJobById`)
- **Exact root cause:** `JobService.getJobById` returned closed or expired jobs to students without role-checking.
- **Reproduction:** Student views job details of a closed/expired job via URL navigation.
- **Affected files:** `JobService.java`, `JobServiceTest.java`.
- **Fix:** If caller has role STUDENT and job is not ACTIVE or deadline has expired, throw `ResourceNotFoundException("Job not found with id: " + id)`. Recruiters and admins can still access their owned/managed jobs.
- **Test:** `JobServiceTest` regression tests.
- **Status:** ✅ Fixed + 🔵 Verified.

### BUG-009 — RecruiterApplicationService.getOwnedJobs() loads ALL jobs in memory (P2, ✅ Fixed + 🔵 Verified)
- **Component:** Recruiter applications (`RecruiterApplicationService.getOwnedJobs`)
- **Exact root cause:** `getOwnedJobs(User recruiter)` called `jobRepository.findAll()` and filtered in Java memory (`stream().filter(...)`).
- **Reproduction:** As table grows, every recruiter applications call loads full database table.
- **Affected files:** `RecruiterApplicationService.java`, `JobRepository.java`, `RecruiterApplicationServiceTest.java`.
- **Fix:** Used database-indexed query `jobRepository.findByRecruiter_Id(recruiter.getId())`.
- **Test:** `RecruiterApplicationServiceTest` (4 tests).
- **Status:** ✅ Fixed + 🔵 Verified.

### BUG-010 — RecruiterService.listJobs company mapping (P2, 🔵 Verified Already Fixed)
- **Component:** Recruiter jobs (`RecruiterService.listJobs`)
- **Verification:** Verified `RecruiterService.listJobs()` maps `mapperService.companyToDTO(j.getCompany())` properly. No regression.
- **Status:** 🔵 Verified.

### BUG-011 — Admin can disable the last enabled ADMIN account (P3, ✅ Fixed + 🔵 Verified)
- **Component:** Admin (`AdminService.updateUserStatus`)
- **Exact root cause:** Disabling an admin account did not check if other active admin accounts remained, risking complete system lockout.
- **Reproduction:** Admin disables the sole ADMIN user.
- **Affected files:** `AdminService.java`, `AdminServiceTest.java`.
- **Fix:** Added check: if target user is ADMIN and `!enabled`, count active admins; if `<= 1`, throw `IllegalStateException("Cannot disable the last enabled ADMIN account")`.
- **Test:** `updateUserStatus_whenLastAdminDisabled_throwsIllegalStateException` in `AdminServiceTest`.
- **Status:** ✅ Fixed + 🔵 Verified.

### BUG-012 — Concurrent apply race condition DataIntegrityViolationException (P3, ✅ Fixed + 🔵 Verified)
- **Component:** Applications (`ApplicationService.applyToJob`)
- **Exact root cause:** Concurrent rapid clicks on Apply could bypass the `hasStudentApplied` check and hit the unique constraint `uk_student_job`, returning HTTP 500.
- **Reproduction:** Simultaneous concurrent POST requests for same student and job.
- **Affected files:** `ApplicationService.java`, `ApplicationServiceTest.java`.
- **Fix:** Caught `DataIntegrityViolationException` in `applyToJob` and re-threw `BadRequestException("You have already applied for this job")`.
- **Test:** `applyToJob_whenDataIntegrityViolation_throwsBadRequestException` in `ApplicationServiceTest`.
- **Status:** ✅ Fixed + 🔵 Verified.

### BUG-013 — JobDetails dead/misleading buttons (P3, ✅ Fixed + 🔵 Verified)
- **Component:** Job Details (`JobDetails.jsx`)
- **Exact root cause:** Presentational actions without backend implementations (e.g. Bookmark, Share) caused user confusion.
- **Fix:** Cleaned up `JobDetails.jsx` to render clear, role-aware primary actions (Apply for STUDENT, back navigation, status alerts).
- **Status:** ✅ Fixed + 🔵 Verified.

### BUG-014 — Stale comments in frontend service files (P4, ✅ Fixed + 🔵 Verified)
- **Component:** Frontend (`applicationService.js`, `MyApplications.jsx`, `ResumeUpload.jsx`)
- **Fix:** Removed outdated TODO and placeholder strings in UI components; aligned status messages.
- **Status:** ✅ Fixed + 🔵 Verified.

### BUG-015 — JobSpecification deadline timezone alignment (P4, ✅ Fixed + 🔵 Verified)
- **Component:** Job search specification (`JobSpecification.java`)
- **Fix:** Aligned `(deadline IS NULL OR deadline >= CURRENT_TIMESTAMP)` with database UTC timezone handling.
- **Status:** ✅ Fixed + 🔵 Verified.

### BUG-016 — Non-reactive authentication state preventing dashboard redirection on login (P1, ✅ Fixed + 🔵 Verified)
- **Component:** Frontend Auth (`App.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`, `AuthContext.jsx`, `api.js`)
- **Exact root cause:** `App.jsx` read `localStorage.getItem('token')` and `localStorage.getItem('role')` only once on initial render closure (`const isAuthed = Boolean(token)`). When `LoginPage.jsx` saved the token to `localStorage` and called `navigate('/dashboard')`, `App.jsx` was not re-rendered. As a result, the route guards evaluated the stale `isAuthed = false` and immediately redirected back to `/login`, leaving the user on the login page despite displaying the "Welcome back" toast.
- **Fix:** 
  1. Created `frontend/src/context/AuthContext.jsx` with reactive `token`, `role`, `user`, `isAuthenticated`, `login()`, and `logout()`.
  2. Wrapped application with `<AuthProvider>` in `main.jsx`.
  3. Updated `App.jsx` route guards (`RequireAuth`, `RequireRole`, `PublicOnlyRoute`) to use `useAuth()`.
  4. Updated `LoginPage.jsx` and `RegisterPage.jsx` to call `login(token, role)` and navigate to role-specific dashboards (`/recruiter/dashboard`, `/admin/dashboard`, `/dashboard`).
  5. Updated `Navbar.jsx`, `JobList.jsx`, and `JobDetails.jsx` to consume `useAuth()`.
  6. Updated `api.js` response interceptor so 401 on `/api/auth/*` passes the error message directly without page reloads.
  7. Added explicit handlers for `DisabledException` and `LockedException` in `GlobalExceptionHandler.java`.
- **Test:** `test_auth_flow_e2e.ps1` (all 8 scenarios passed), `npm run build` (0 errors), `mvn test` (118/118 passed).
- **Status:** ✅ Fixed + 🔵 Verified.

### BUG-017 — Cross-Role Dashboard Isolation & Interceptor Redirect Loops (P1, ✅ Fixed + 🔵 Verified)
- **Component:** Frontend Routing & Interceptors (`App.jsx`, `Navbar.jsx`, `AuthContext.jsx`, `api.js`)
- **Exact root cause:**
  1. `App.jsx` rendered `RecruiterDashboard` and `AdminDashboard` directly inside `/dashboard` without canonical route redirection, causing conflicting URLs and stale routing states.
  2. `Navbar.jsx` hardcoded the brand logo `<Link to="/dashboard">` for all users rather than role-specific roots (`/recruiter/dashboard`, `/admin/dashboard`, `/dashboard`).
  3. `api.js` invoked `window.location.assign('/login')` on 401 responses, tearing down the React tree with a hard page reload rather than reactive state dispatching.
  4. `AuthContext.jsx` lacked cross-tab storage sync and `auth:unauthorized` event listeners.
- **Fix:**
  1. Updated `App.jsx` `/dashboard` route to redirect `RECRUITER` to `/recruiter/dashboard` and `ADMIN` to `/admin/dashboard`.
  2. Updated `Navbar.jsx` brand logo link to point dynamically to `brandHome` based on `useAuth().role`.
  3. Replaced hard reloads in `api.js` with `window.dispatchEvent(new Event('auth:unauthorized'))` and preserved `error.response` in `normalizedError`.
  4. Added `auth:unauthorized` and `storage` event listeners to `AuthContext.jsx` to keep auth state perfectly synchronized.
- **Test:** `test_role_isolation.js` (5/5 suites, multi-cycle role switching passed), `npm run build` (0 errors), `mvn test` (118/118 passed).
- **Status:** ✅ Fixed + 🔵 Verified.

### BUG-018 — Email delivery and structured password reset link configuration (P1, ✅ Fixed + 🔵 Verified)
- **Component:** Backend Mail & Password Reset (`EmailService.java`, `AuthService.java`, `application.properties`, `ResetPasswordPage.jsx`, `ForgotPasswordPage.jsx`)
- **Exact root cause:**
  1. `EmailService.java` conditioned email enablement strictly on non-blank `MAIL_USERNAME`. In local development or test SMTP servers (such as Mailpit/MailHog) without authentication, email sending was incorrectly disabled.
  2. `AuthService.java` sent a raw unstructured text message rather than a complete, professional password reset email with the frontend link (`${frontendUrl}/reset-password?token=...`).
  3. `application.properties` was missing `app.frontend-url` and `spring.mail.from` properties.
  4. `ResetPasswordPage.jsx` lacked a dedicated success confirmation view.
- **Fix:**
  1. Updated `EmailService.java` to support `sendPasswordResetEmail(to, resetLink, ttlMinutes)`, configurable `fromEmail`, and dynamic enablement based on `spring.mail.host` / `app.mail.enabled`.
  2. Updated `AuthService.java` to inject `app.frontend-url` and dispatch formatted reset emails via `emailService.sendPasswordResetEmail()`.
  3. Added `app.frontend-url` and `spring.mail.from` to `application.properties`.
  4. Updated `ResetPasswordPage.jsx` to display a success confirmation card with a "Back to Login" action and no automatic login.
  5. Added `EmailServiceTest.java` (3 unit tests) and added password reset tests to `AuthRuntimeTest.java` (total 123 backend tests).
- **Test:** `test_password_reset_e2e.js` (100% PASS across Student, Recruiter, Admin, user enumeration, expired/used/weak token edge cases), `mvn test` (123/123 passed), `npm run build` (0 errors).
- **Status:** ✅ Fixed + 🔵 Verified.

### BUG-019 — Missing Google OAuth 2.0 / OIDC Authentication (P1, ✅ Implemented + 🔵 Verified)
- **Component:** Authentication & Security (`pom.xml`, `OAuth2ClientConfig.java`, `SecurityConfig.java`, `AuthService.java`, `AuthController.java`, `GoogleAuthRequest.java`, `OAuth2AuthenticationSuccessHandler.java`, `OAuth2AuthenticationFailureHandler.java`, `OAuthCallbackPage.jsx`, `LoginPage.jsx`, `App.jsx`)
- **Exact root cause:** The application lacked Google OAuth 2.0 / OpenID Connect authentication, preventing users from signing in seamlessly with their Google credentials.
- **Fix:**
  1. Added `spring-boot-starter-oauth2-client` dependency.
  2. Implemented `OAuth2ClientConfig.java` to safely support environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`) with safe fallbacks when unconfigured.
  3. Implemented `AuthService.processOAuthPostLogin(email, fullName, providerId, provider)`:
     - Normalizes email to lowercase.
     - Auto-registers new users strictly with role `STUDENT` (never ADMIN).
     - Preserves existing accounts' role (`STUDENT`, `RECRUITER`, `ADMIN`) without duplicate creation.
     - Enforces account status check (`enabled` flag; throws `DisabledException` for disabled accounts).
     - Generates standard Campus Job JWT signed with backend HMAC-SHA256 secret.
  4. Added `POST /api/auth/google` in `AuthController.java` with DTO validation.
  5. Implemented `OAuth2AuthenticationSuccessHandler` and `OAuth2AuthenticationFailureHandler` with lazy dependency resolution to avoid circular references.
  6. Implemented frontend `OAuthCallbackPage.jsx` and registered `/oauth/callback` in `App.jsx`.
  7. Updated `LoginPage.jsx` to include "Continue with Google" button with Google SVG logo, URL error parameter toast detection, and visual divider.
  8. Added unit tests in `AuthServiceTest.java` (4 tests) and integration tests in `AuthRuntimeTest.java` (2 tests), bringing total backend tests to 129.
- **Test:** `test_oauth_end_to_end.js` (19/19 tests PASS), `test_role_isolation.js` (5/5 suites PASS), `mvn test` (129/129 PASS), `npm run build` (0 errors).
- **Status:** ✅ Fixed + 🔵 Verified.



