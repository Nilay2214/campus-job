# FINAL APPLICATION-WIDE AUDIT + REPAIR — Execution Plan

Phase: FULL AUDIT → FIX P1→P4 → REGRESSION TESTS → BUILD → LIVE MYSQL → REPORT

## AUDIT FINDINGS (BUG-007..015)
- [x] BUG-007 P1: applyToJob ignores expired deadline (only checks status==ACTIVE)
- [x] BUG-008 P1: getJobById returns non-ACTIVE/expired jobs to students
- [x] BUG-009 P2: RecruiterApplicationService.getOwnedJobs() loads ALL jobs in memory
- [x] BUG-010 P2: (VERIFIED ALREADY FIXED in RecruiterService.listJobs — company mapped) — no change needed
- [x] BUG-011 P3: Admin can disable last enabled ADMIN (lockout)
- [x] BUG-012 P3: concurrent apply race returns 500 instead of clean duplicate message
- [x] BUG-013 P3: JobDetails "Bookmark" button is a dead no-op
- [x] BUG-014 P3: stalel comment in applicationService.js withdraw endpoint
- [x] BUG-015 P4: JobSpecification uses server-local now() vs UTC stored timezone

## FIX ORDER
- [x] BUG-007 + BUG-008 (P1) + regression tests
- [x] BUG-009 (P2) + regression tests
- [x] BUG-011 (P3) + regression tests
- [x] BUG-012 (P3) + regression test
- [x] BUG-013/014 (P3) frontend
- [x] BUG-015 (P4) alignment
- [x] Full regression: mvn clean test (118/118 PASS), mvn clean package (BUILD SUCCESS), npm run build (0 errors)
- [x] Live MySQL E2E + report (16 student, 18 recruiter, 19 rbac, 5 security, 11 resume, 4 disabled, 5 front validate = 100% PASS)

---
## ARCHIVE — LIVE MySQL E2E Validation — Execution Plan

Priority: BUILD → START BACKEND → VERIFY DB → LIVE E2E → FRONTEND → BUILD/TEST → REPORT

## PHASE 1 — BUILD & START BACKEND
- [x] Verify .env loaded securely (DB_USERNAME=placement_app, DB_PASSWORD length 22, MySQL 3306 reachable)
- [x] `mvn clean package -DskipTests` (build runnable jar)
- [x] Start Spring Boot on :8080 with dev profile + env from .env
- [x] Verify MySQL connection succeeds / placement_db accessible
- [x] Verify /actuator/health → healthy (HTTP 200, {"status":"UP"})
- [x] Confirm DataSeeder created admin@placement.com + recruiter@placement.com (verified via login)

## PHASE 2 — LIVE MYSQL E2E
- [x] Run live_test_student.ps1 (16/16 PASS)
- [x] Run live_test_recruiter.ps1 (18/18 PASS, incl. R17 delete-with-apps=409, R18 delete-no-apps=204)
- [x] Run RBAC 401/403/200 matrix (19/19 PASS)
- [x] Run security tests: self-reg ADMIN blocked, disabled login blocked (verified via disabled_account_test D1-D3), tampered JWT (401), cross-recruiter job (404), cross-student withdraw (403)
- [x] Resume live security tests (11/11 PASS): valid PDF, invalid PDF, >5MB, owner/unrelated-student/unrelated-recruiter, /uploads blocked

## PHASE 3 — LIVE BROWSER (Vite :3000)
- [x] Start Vite dev server on :3000 (VITE v5.4.21 ready, http://localhost:3000)
- [x] HTTP-level browser validation (5/5 PASS): root 200, #root mount, CORS localhost:3000, admin login API, Vite serves JS modules
- [x] NOTE: No Playwright/Puppeteer MCP available; browser validation is HTTP-level (frontend serving + CORS + exact API calls frontend makes), not pixel-level rendering
- [x] Backend was restarted after an interruption (was stopped); re-verified health (HTTP 200) and re-ran front_validate (5/5 PASS with backend up)

## PHASE 4 — BUG FIXES
- [x] No NEW genuine runtime bugs found during this live validation run
- [x] Verified previously-fixed bugs work against live MySQL: EditJob companyId (R7 edit=200), PostJob eligibility (R5 create=200), disabled-account auth blocked (disabled_account_test 4/4)
- [x] SEC-C "disabled login" FAIL in security_live_test was a test-script path issue (disable endpoint 404), NOT an app bug; confirmed via dedicated DbHelper disabled_account_test (login blocked after disable, works after re-enable)

## PHASE 5 — FINAL REGRESSION
- [x] `mvn clean test` = 93 tests, 0 failures, 0 errors, BUILD SUCCESS
- [x] `mvn clean package` = 93 tests pass, jar built, BUILD SUCCESS
- [x] `npm run build` = exit 0, built in 23.87s

## PHASE 6 — REPORT
- [x] Final report: A. Live MySQL E2E, B. Live browser validation, C. Automated/H2 tests, D. Bugs, E. Files modified, F. Security/RBAC, G. Resume security, H. UI/UX, I. Build/test, J. Remaining, K. Readiness score

## PHASE 7 — STUDENT DASHBOARD DEEP-DIVE (user feedback)
- [x] Code-level audit of StudentDashboard.jsx, jobService, applicationService, api.js, App.jsx routing
- [x] Confirmed data contracts against LIVE MySQL (dashboard_repro.ps1): jobs = Page `{content}`, applications = plain array
- [x] StudentDashboard reads jobsPage?.content and Array.isArray(apps) — CONTRACT MATCHED, dashboard is FUNCTIONALLY CORRECT
- [x] JWT interceptor attaches Bearer token; 401→clear+redirect — auth correct (not weakened)
- [x] /dashboard renders StudentDashboard only for role STUDENT (App.jsx) — routing correct
- [x] npm run build SUCCESS (22.70s, StudentDashboard chunk 10.64 kB) — no frontend regression
- [x] VERDICT: Student Dashboard is NOT broken by a response-shape/auth/routing bug

## MASTER BUG REGISTER (genuine issues found in code audit)
- [x] P2 Profile data loss: StudentProfile.jsx sends linkedInUrl/githubUrl/portfolioUrl/address/aboutMe but backend StudentProfile entity+DTO+service only support fullName/phone/... — fields silently dropped (no FAIL_ON_UNKNOWN_PROPERTIES)
- [x] P2 RegisterPage collects fullName but RegisterRequest DTO has no name field — name discarded at registration
- [x] P2 Expired jobs still listed: JobSpecification filters only by status=ACTIVE, not deadline — past-deadline jobs appear to students
- [x] P2 ManageJobs company column blank: RecruiterService.listJobs sets company(null) in JobDTO — company name shows '—' on ManageJobs & RecruiterDashboard
- [x] P3 Admin listCompanies N+1: jobRepository.findByCompanyIdOrderByCreatedAtDesc per company
- [x] P3 No resume DELETE endpoint exists despite UI/client references
- [x] P3 No Google OAuth/OTP/Twilio/password-reset/mail-send anywhere (email config unused) — not a bug, gap vs. vision
- [x] NOTE: No browser automation (Playwright/Puppeteer) available; validation is live-API + build based

## AUDIT-009 — Recruiter application status filter (server-side)
- [x] Root cause: `RecruiterApplications.jsx` filtered status client-side only while pagination was server-side → filtering could miss rows on later pages / show empty pages
- [x] Backend: added `findByJobInAndStatus` + `findByJobIdAndJobInAndStatus` to `ApplicationRepository`; `RecruiterApplicationService.listApplications` now accepts + validates `status`; `RecruiterApplicationController` forwards `status` param
- [x] Frontend: `RecruiterApplications.jsx` sends `status` in params; no longer relies on client-side filter
- [x] Regression tests: `RecruiterApplicationServiceTest` (4 tests: status-only, status+jobId, no-status, invalid-status)
- [x] `mvn test` = 104 tests, 0 failures, 0 errors, BUILD SUCCESS
- [x] `mvn package -DskipTests` = BUILD SUCCESS
- [x] `npm run build` = exit 0, built in 7.37s
- [x] Live MySQL E2E (`verify_fix9_status_filter.ps1`): PASS — ?status=SHORTLISTED returns only the SHORTLISTED application, excludes PENDING
