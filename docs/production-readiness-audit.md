# Production Readiness Audit — Campus Job

> **Role:** Senior Java + Spring Boot Architect
> **Scope:** Full backend audit (no code modified)
> **Build state:** 67 tests passing, BUILD SUCCESS

---

## Executive Summary

The project follows a clean **Controller → Service → Repository** layered architecture with a solid DTO-based API boundary, JWT auth, role-based security, and a passing test suite. It is a strong portfolio/learning project. However, several items must be addressed before it is truly production-ready, most notably: **resume storage is not implemented**, **no email sending is wired**, **admin/recruiter/stub endpoints are placeholders**, **JWT secret is hardcoded**, and **several services are not fully implemented**. Details below.

---

## 1. Critical Issues

| # | Area | Issue |
|---|------|-------|
| C1 | **Resume upload** | `StudentService.uploadResume()` is a **no-op** — files are accepted and silently discarded. The controller even returns "Storage is not yet implemented." No persistence (DB or object storage), no download endpoint. Claims "feature-complete" but this core feature is missing. |
| C2 | **Mail service** | `spring-boot-starter-mail` is in `pom.xml` and mail config is in `application.properties`, but **no mail-sending code exists anywhere**. Placeholder credentials (`your-email@gmail.com` / `your-app-password`) are committed. |
| C3 | **Admin module** | `AdminController` only has a stub `GET /api/admin/dashboard` returning a string. The frontend has `ManageUsers`, `ManageCompanies`, `PlacementAnalytics`, `Reports`, `AuditLogs` pages — **no backend endpoints exist** for these. |
| C4 | **Hardcoded secrets** | `app.jwt.secret` and `spring.datasource.password` are hardcoded in `application.properties` and committed to the repo. The JWT secret is a weak, predictable value. |
| C5 | **Recruiter job management** | Only `POST` and `GET` (list) jobs exist. The frontend has `EditJob`, `ManageJobs`, `RecruiterApplications`, `CandidateDetails`, `CompanyProfile` pages, but **no PUT/DELETE job, no application-review, no company-profile endpoints** on the backend. |

---

## 2. Medium Issues

| # | Area | Issue |
|---|------|-------|
| M1 | **JobRepository** | `findByStatusOrderByCreatedAtDesc` and `findByCompanyIdOrderByCreatedAtDesc` are **declared but never used** (dead code). |
| M2 | **RecruiterService.listJobs()** | Duplicate/overloaded methods: a no-arg `listJobs()` returning `List<Job>` (unused by real controller) and a parameterized `listJobs(...)`. The DTO mapping in `listJobs(...)` sets `company(null)` and **re-implements mapping manually** instead of using `MapperService` (code duplication, inconsistent with `JobService`). |
| M3 | **ApplicationService.applyToJob** | Duplicate-application check loads **all** of a student's applications and iterates in Java (`findByStudent` + stream). Should be a single indexed DB query (`existsByStudentAndJob`). O(n) growth; also `appliedAt` stored as `String` (see M9). |
| M4 | **RecruiterService.createJob** | Controller returns `Job` entity directly (not a DTO) — leaks entity and inconsistent with `RecruiterJobController` list which returns `Page<JobDTO>` and `JobService` which returns DTOs. |
| M5 | **RecruiterJobController.createJob** | `@RequestBody JobRequest request` has **no `@Valid`** — validation annotations on `JobRequest` are not enforced. Same for `StudentProfileController.saveProfile` (`@RequestBody StudentProfileRequest` — no `@Valid`). |
| M6 | **Login security** | `AuthService.login` and `AuthService.register` build `UserDetails` manually and **re-fetch the user** after authentication. `login` uses `authenticationManager.authenticate` which throws `BadCredentialsException` (now handled → 401, good), but `register` uses `Role.valueOf` which can throw `IllegalArgumentException` → 400 (acceptable) yet also **registers ADMIN freely** — any user can self-register as ADMIN (privilege escalation risk). |
| M7 | **Self-registration as ADMIN** | `RegisterPage` allows selecting `ADMIN` role. Any caller can `POST /api/auth/register` with `role: "ADMIN"` and gain admin access. This is a **security vulnerability**. |
| M8 | **`StudentService.getProfile`** | Throws `IllegalArgumentException("Profile not found")` → 400, but for a missing resource it should be **404** (`ResourceNotFoundException`). |
| M9 | **`Application.appliedAt`** | Stored as `String` (`LocalDateTime.now().toString()`). Should be `LocalDateTime`/`Instant` for correctness, sorting, and range queries. |
| M10 | **`Job` / `Company` status as String** | `status`, `employmentType`, `workMode`, `experience` are free-form `String`. Should be enums or constrained (validation) to avoid inconsistent data. |
| M11 | **`User.enabled`** | Defaults to `false` in entity but `AuthService.register` sets `enabled(true)`. No email-verification flow; the flag is effectively unused. |
| M12 | **Duplicate-application race** | `applyToJob` check-then-insert has no DB unique constraint (`(student_id, job_id)`), so concurrent duplicate applies could pass. |
| M13 | **Company creation** | No endpoint to create/manage companies. Recruiter must reference an existing `companyId` (`companyRepository.findById`). No way to add a company via API. |
| M14 | **`JobService.getActiveJobs`** | Builds criteria with `status("ACTIVE")`, but `getAllJobs` already defaults to ACTIVE in `JobSpecification` — redundant but harmless. |

---

## 3. Minor Issues

| # | Area | Issue |
|---|------|-------|
| N1 | **MapperService** | `JobService` uses `MapperService` cleanly, but `RecruiterService.listJobs` re-implements the same mapping manually → **duplication** and risk of drift. |
| N2 | **`@Transactional` scope** | `ApplicationService` is `@Transactional` at class level; `applyToJob` and `withdrawApplication` repeat `@Transactional` (redundant). `JobService` is `@Transactional(readOnly = true)` at class level — good. |
| N3 | **Exception handling** | `IllegalArgumentException` → 400 is used for many semantically different cases (job not found, profile not found, application not found, invalid input). This conflates "bad request" with "not found"; should use domain exceptions. |
| N4 | **`GlobalExceptionHandler`** | Missing `@ExceptionHandler` for `UsernameNotFoundException`, `MethodArgumentTypeMismatchException`, `HttpMessageNotReadableException`, `DataIntegrityViolationException`, `AuthenticationException`. These fall to generic 500. |
| N5 | **IDOR / ownership** | `withdrawApplication` checks ownership — good. But `getJobById` returns any job regardless of status; and there's no ownership check on recruiter job detail (no such endpoint exists). |
| N6 | **`JwtUtil`** | Secret is read from `@Value` (good) but derived from a hardcoded weak value. No claim for role/authorities in the token — role is resolved from DB on each request (fine, but adds a DB call per request). |
| N7 | **`JwtAuthenticationFilter`** | No exception handling around `JwtUtil.extractUsername`/`validateToken` — an invalid/malformed token throws `JwtException` uncaught → could produce a 500. Should catch and continue as unauthenticated. |
| N8 | **`Application` entity** | `Job` and `StudentProfile` are `FetchType.LAZY`; no `@JsonIgnore`/DTO mapping — serializing `Application` directly (controller returns `Application`) can cause lazy-loading/serialization issues or expose internal relationships. |
| N9 | **`StudentProfileRequest.cgpa`** | Declared as `String` with `@DecimalMin/@DecimalMax` — those annotations on a String are ineffective (they only apply to numeric types). Validation is effectively skipped. |
| N10 | **`JobRequest`** | `@Valid` missing at controller (see M5). Also `deadline` is `LocalDateTime` — no `@Future` validation. |
| N11 | **Response status codes** | `createJob` returns `200 OK` instead of `201 Created`; `applyToJob` returns `200` instead of `201`. Minor REST convention issue. |
| N12 | **`GlobalErrorController`** | Manual `/error` mapping; acceptable but could be simplified. Shows status/message/error structure. |
| N13 | **CORS** | Now allows 3000 and 5173 (good). Should be externalized to config (env) rather than hardcoded. |
| N14 | **OpenAPI** | Good Swagger setup with bearer auth. But protected endpoints all share the global security requirement; per-endpoint role info not documented. |
| N15 | **`bin/` directory** | Compiled `.class` files (`backend/bin/`) are committed to the repo — should be in `.gitignore`. |

---

## 4. Nice-to-have Improvements

| # | Area | Improvement |
|---|------|-------------|
| H1 | **Resume storage** | Implement real storage (cloud/object storage or DB `LONGBLOB`) + download endpoint with proper content-type and size limits. |
| H2 | **Email** | Implement a `MailService` (e.g., application confirmation, job-posted notifications) using the existing `spring-boot-starter-mail`. |
| H3 | **Admin endpoints** | Implement `ManageUsers` (list/disable/toggle), `ManageCompanies` (CRUD), `PlacementAnalytics` (stats), `Reports`, `AuditLogs` (DB-backed audit trail). |
| H4 | **Job lifecycle** | Add `PUT /api/recruiters/jobs/{id}` (update), `DELETE /api/recruiters/jobs/{id}` (close/delete), application status review (accept/reject). |
| H5 | **Company management** | Add company CRUD for recruiters/admins. |
| H6 | **Config externalization** | Move DB creds, JWT secret, mail creds, CORS origins to environment variables / `application-{profile}.yml` and use placeholders. |
| H7 | **Role-based registration** | Prevent self-registration as ADMIN; require pre-created admins or an admin approval flow. |
| H8 | **Enums** | Use Java enums for `Job.status`, `employmentType`, `workMode`, `experience`, `Application.status`, `User.enabled`. |
| H9 | **DB constraints** | Add unique constraint `(student_id, job_id)` on applications; indexes on `jobs(status)`, `jobs(company_id)`, `jobs(recruiter_user_id)`. |
| H10 | **Audit logging** | Add an audit log (who did what, when) for admin features. |
| H11 | **Rate limiting / security headers** | Add security headers (HSTS, X-Content-Type-Options), rate limiting on auth endpoints, and content-length limits. |
| H12 | **Lombok `@Builder` on DTOs** | Some DTOs use `@Data` only; consider `@Builder` for immutable DTOs. |
| H13 | **Pagination defaults** | `@RequestParam(defaultValue = "10")` pageSize is fine; consider a global max-size cap via `application.properties`. |
| H14 | **Testing** | Add tests for `AuthService.login` bad credentials, `StudentService` profile-not-found (404), `JobService` filters, and `GlobalExceptionHandler` for `BadCredentialsException`. |
| H15 | **CI/CD** | Add GitHub Actions workflow (build + test), Docker Compose for MySQL + app, and a health-check endpoint (`/actuator/health`). |
| H16 | **Schema migrations** | Use Flyway/Liquibase instead of `ddl-auto=update` for reproducible migrations. |

---

## 5. Detailed Check Findings (by the 25 requested areas)

| # | Area | Status | Notes |
|---|------|--------|-------|
| 1 | Folder structure | ✅ Good | `backend/frontend/docs` split is clean. |
| 2 | Package structure | ✅ Good | Config/controller/dto/entity/exception/repository/service/specification — well organized. |
| 3 | Entity design | ⚠️ Fair | String fields for status/enums; `appliedAt` as String; no unique constraints; `enabled` unused. |
| 4 | DTO design | ⚠️ Fair | Good separation (JobDTO/JobDetailDTO/Request), but controllers expose entities (`Application`, `Job`) directly. |
| 5 | Validation | ⚠️ Partial | `@Valid` missing on some `@RequestBody`; `cgpa` String + numeric annotations ineffective; no `@Future` on deadline. |
| 6 | Repository layer | ⚠️ Fair | Clean JPA; some unused methods; duplicate-check is O(n) in Java. |
| 7 | Service layer | ⚠️ Fair | Logic mostly correct; `uploadResume` no-op; manual DTO mapping duplication; overloaded `listJobs`. |
| 8 | Controller layer | ⚠️ Fair | Clean REST; missing `@Valid`; returns entities; stub controllers (Admin/Recruiter/Student overview). |
| 9 | JWT implementation | ⚠️ Fair | Correct generate/validate; insecure default secret; no role claim; filter lacks exception handling. |
| 10 | Spring Security | ⚠️ Good | Proper stateless JWT, role matchers, method security, CORS, 401 entry point (now added). |
| 11 | Exception handling | ⚠️ Fair | Centralized `@RestControllerAdvice`; `IllegalArgumentException`→400 conflates domains; missing handlers for several exceptions. |
| 12 | Logging | ⚠️ Minimal | `JobService`/`StudentJobController` use `SLF4J`; most services lack logging. |
| 13 | Configuration | ⚠️ Fair | Hardcoded secrets; `ddl-auto=update`; no env-based profiles. |
| 14 | Mail service | ❌ Not implemented | Dependency present, no code. |
| 15 | Database schema | ⚠️ Fair | Auto-generated; no migrations; missing unique constraints/indexes. |
| 16 | API consistency | ⚠️ Partial | Mixed entity vs DTO returns; 200 vs 201; missing `@Valid`; inconsistent error semantics. |
| 17 | Code duplication | ⚠️ Partial | Manual DTO mapping in `RecruiterService`; repeated `@Transactional`; duplicate `listJobs`. |
| 18 | Naming conventions | ✅ Good | Consistent and descriptive package/class/method names. |
| 19 | SOLID | ⚠️ Partial | SRP mostly respected; DIP good (constructor injection); `GlobalExceptionHandler`/`MapperService` good; some violations (overloaded service methods). |
| 20 | Clean Architecture | ⚠️ Good | Layered; controllers don't touch repos; entities exposed in some responses is a leak. |
| 21 | Performance | ⚠️ Fair | DB-level pagination (good); duplicate-apply O(n); `findByStatus`/`findByCompanyId` unused; no indexes specified. |
| 22 | Security vulnerabilities | ❌ Critical | Self-register as ADMIN; hardcoded JWT secret; weak secret; no rate limiting; JWT filter may 500 on malformed token. |
| 23 | Missing features | ❌ Several | Resume storage, email, admin endpoints, job update/delete, application review, company management, audit log. |
| 24 | Resume quality | ✅ Good | Clean, readable, well-structured, consistent naming, good documentation comments. |
| 25 | Industry best practices | ⚠️ Partial | DTOs, layering, security, tests, Swagger all present; missing migrations, externalized config, CI/CD, audit, rate limiting. |

---

## 6. Recommended Priority Order

1. **Fix the security vulnerability** — prevent self-registration as ADMIN (C7/M7).
2. **Externalize & secure secrets** — env vars for JWT secret, DB password, mail creds (C4/H6).
3. **Implement resume storage** or clearly mark it as a known limitation (C1).
4. **Enforce `@Valid`** on all `@RequestBody` (M5) and fix `cgpa` validation (N9).
5. **Replace `IllegalArgumentException`→400** with dedicated `ResourceNotFoundException`→404 for missing resources (M8/N3).
6. **Add DB unique constraint** on applications `(student, job)` (M12).
7. **Restore `appliedAt` as `LocalDateTime`** (M9).
8. **Implement admin + recruiter endpoints** to match the frontend (C3/C5).
9. **Add Flyway migrations** and turn off `ddl-auto=update` (H16).
10. **Add CI/CD** and a health endpoint (H15).

---

*This audit is analysis only. No production code, tests, or configuration were modified. All 67 tests still pass.*
