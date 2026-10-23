# API Testing Guide — Campus Job

> **Role:** Senior Java Spring Boot QA Engineer
> **Scope:** Backend REST API testing guide + Postman collection reference.
> **Base URL:** `http://localhost:8080`
> **Auth:** All protected endpoints require `Authorization: Bearer <JWT>`.

---

## 1. Global Conventions

### Headers
| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` (all JSON endpoints) |
| `Authorization` | `Bearer <token>` (protected endpoints only) |
| `Accept` | `application/json` |

### Error Response Shape
`GlobalExceptionHandler` (`@RestControllerAdvice`) returns standardized JSON:
- **`400`** — `{ "error": "<message>" }` (IllegalArgumentException) or field map (validation)
- **`403`** — `{ "error": "<message>" }` (AccessDeniedException)
- **`404`** — `{ "error": "<message>" }` (ResourceNotFoundException)
- **`409`** — `{ "error": "<message>" }` (IllegalStateException)
- **`500`** — `{ "error": "Internal server error" }`

Validation errors (`MethodArgumentNotValidException`) return a **field→message map**:
```json
{ "email": "must not be blank", "password": "size must be between 6 and 2147483647" }
```

### Note on Spring Security default for unauthenticated requests
There is **no `authenticationEntryPoint`** configured in `SecurityConfig.java`. Therefore, an unauthenticated request to a **protected** endpoint returns **403 Forbidden** (Spring Security 6 default `Http403ForbiddenEntryPoint`), not 401. This is expected behavior.

---

## 2. Security Configuration Facts (source-verified)

From `SecurityConfig.java`:
```java
.requestMatchers("/api/auth/**", "/api/public/**", "/error").permitAll()
.requestMatchers("/api/admin/**").hasRole("ADMIN")
.requestMatchers("/api/recruiters/**").hasAnyRole("RECRUITER", "ADMIN")
.requestMatchers("/api/students/**").hasAnyRole("STUDENT", "ADMIN")
.anyRequest().authenticated()
```
- CSRF: **disabled** (`AbstractHttpConfigurer::disable`)
- CORS: allowed origin **only** `http://localhost:3000`
- JWT filter: registered before `UsernamePasswordAuthenticationFilter`
- Session: **STATELESS**

### ⚠️ Unreachable Endpoint (security config conflict)
`StudentJobController` methods are annotated `@PreAuthorize("hasAnyRole('STUDENT','RECRUITER','ADMIN')")`, but the **URL-level** rule `"/api/students/**" → hasAnyRole("STUDENT","ADMIN")` **excludes RECRUITER**. Therefore a **`RECRUITER` is blocked at the URL level** and cannot reach `/api/students/jobs*`. These endpoints are effectively reachable only by `STUDENT` and `ADMIN`.

---

## 3. API Testing Checklist

### A. Authentication
- [ ] `POST /api/auth/register` — success (returns token + role)
- [ ] `POST /api/auth/register` — duplicate email → 400
- [ ] `POST /api/auth/register` — invalid email → 400
- [ ] `POST /api/auth/register` — password < 6 chars → 400
- [ ] `POST /api/auth/register` — invalid role → 500 (enum conversion)
- [ ] `POST /api/auth/login` — success (returns token + role)
- [ ] `POST /api/auth/login` — wrong password → 500 (BadCredentialsException not handled)
- [ ] `POST /api/auth/login` — unknown email → 500

### B. Student Profile
- [ ] `POST /api/students/profile` — success (STUDENT) → 200
- [ ] `POST /api/students/profile` — no token → 403
- [ ] `POST /api/students/profile` — wrong role (RECRUITER) → 403
- [ ] `POST /api/students/profile` — blank fullName → 400
- [ ] `POST /api/students/profile` — phone not 10 digits → 400
- [ ] `POST /api/students/profile` — cgpa > 10 → 400
- [ ] `GET /api/students/profile` — success (STUDENT) → 200
- [ ] `GET /api/students/profile` — profile not exists → 400 ("Profile not found")
- [ ] `POST /api/students/profile/resume` — valid PDF → 200
- [ ] `POST /api/students/profile/resume` — missing file → 400
- [ ] `POST /api/students/profile/resume` — empty file → 400
- [ ] `POST /api/students/profile/resume` — non-PDF content type → 400
- [ ] `POST /api/students/profile/resume` — >5MB file → 400

### C. Jobs (Student view)
- [ ] `GET /api/students/jobs` — success (STUDENT) → 200 paginated
- [ ] `GET /api/students/jobs` — pageNumber < 0 → 400
- [ ] `GET /api/students/jobs` — pageSize 0 or >100 → 400
- [ ] `GET /api/students/jobs` — blank sortBy → 400
- [ ] `GET /api/students/jobs` — disallowed sortBy → 400
- [ ] `GET /api/students/jobs` — filter by title/location/employmentType/workMode/salaryMin/salaryMax/requiredSkills/companyId
- [ ] `GET /api/students/jobs/{id}` — existing job → 200
- [ ] `GET /api/students/jobs/{id}` — missing job → 404
- [ ] `GET /api/students/jobs/active/list` — success → 200
- [ ] `GET /api/students/jobs*` — as RECRUITER → **403** (unreachable, see §2)

### D. Applications
- [ ] `POST /api/applications/{jobId}` — apply → 200
- [ ] `POST /api/applications/{jobId}` — job not active → 400
- [ ] `POST /api/applications/{jobId}` — duplicate apply → 400
- [ ] `POST /api/applications/{jobId}` — job not found → 400
- [ ] `POST /api/applications/{jobId}` — no profile → 400
- [ ] `GET /api/applications` — list own → 200
- [ ] `DELETE /api/applications/{applicationId}` — withdraw pending → 204
- [ ] `DELETE /api/applications/{applicationId}` — withdraw non-pending → 409
- [ ] `DELETE /api/applications/{applicationId}` — withdraw someone else's → 403

### E. Recruiter Jobs
- [ ] `POST /api/recruiters/jobs` — create → 200
- [ ] `POST /api/recruiters/jobs` — blank title → 400
- [ ] `POST /api/recruiters/jobs` — blank description → 400
- [ ] `POST /api/recruiters/jobs` — missing deadline → 400
- [ ] `POST /api/recruiters/jobs` — missing companyId → 400
- [ ] `POST /api/recruiters/jobs` — negative salary → 400
- [ ] `GET /api/recruiters/jobs` — paginated list (own only) → 200
- [ ] `GET /api/recruiters/jobs` — filter by status / title
- [ ] `GET /api/recruiters/jobs` — sort whitelist enforced

### F. Admin
- [ ] `GET /api/admin/dashboard` — as ADMIN → 200
- [ ] `GET /api/admin/dashboard` — as STUDENT/RECRUITER → 403
- [ ] `GET /api/admin/dashboard` — no token → 403

### G. Security / HTTP
- [ ] `POST /` → **403** (unmapped, protected)
- [ ] `GET /error` → error JSON (permitAll)
- [ ] `OPTIONS` preflight → 200 (CORS)

---

## 4. Postman Collection (Importable JSON)

Save as `docs/placement-postman-collection.json` and import into Postman.

```json
{
  "info": {
    "name": "Campus Job API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": "{{baseUrl}}/api/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"student@example.com\",\n  \"password\": \"secret123\",\n  \"role\": \"STUDENT\"\n}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": "{{baseUrl}}/api/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"student@example.com\",\n  \"password\": \"secret123\"\n}"
            }
          }
        }
      ]
    },
    {
      "name": "Student",
      "item": [
        {
          "name": "Get Profile",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": "{{baseUrl}}/api/students/profile"
          }
        },
        {
          "name": "Save Profile",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{token}}" }
            ],
            "url": "{{baseUrl}}/api/students/profile",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"fullName\": \"Jane Doe\",\n  \"phone\": \"9876543210\",\n  \"department\": \"CSE\",\n  \"branch\": \"CSE\",\n  \"cgpa\": \"8.5\",\n  \"skills\": \"Java,Spring\",\n  \"graduationYear\": \"2026\"\n}"
            }
          }
        },
        {
          "name": "Upload Resume",
          "request": {
            "method": "POST",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "body": { "mode": "formdata", "formdata": [{ "key": "resume", "type": "file", "src": "/path/to/resume.pdf" }] },
            "url": "{{baseUrl}}/api/students/profile/resume"
          }
        },
        {
          "name": "List Jobs (filtered)",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": "{{baseUrl}}/api/students/jobs?page=0&size=10&sortBy=createdAt&sortDirection=desc&title=Java&employmentType=FULL_TIME"
          }
        },
        {
          "name": "Get Job Detail",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": "{{baseUrl}}/api/students/jobs/1"
          }
        },
        {
          "name": "Active Jobs",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": "{{baseUrl}}/api/students/jobs/active/list?page=0&size=10"
          }
        },
        {
          "name": "Apply to Job",
          "request": {
            "method": "POST",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": "{{baseUrl}}/api/applications/1"
          }
        },
        {
          "name": "My Applications",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": "{{baseUrl}}/api/applications"
          }
        },
        {
          "name": "Withdraw Application",
          "request": {
            "method": "DELETE",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": "{{baseUrl}}/api/applications/1"
          }
        }
      ]
    },
    {
      "name": "Recruiter",
      "item": [
        {
          "name": "Create Job",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{token}}" }
            ],
            "url": "{{baseUrl}}/api/recruiters/jobs",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Software Engineer\",\n  \"description\": \"Build backend services\",\n  \"eligibility\": \"B.Tech CSE\",\n  \"requiredSkills\": \"Java,Spring Boot\",\n  \"location\": \"Pune\",\n  \"salaryMin\": 600000,\n  \"salaryMax\": 1200000,\n  \"employmentType\": \"FULL_TIME\",\n  \"workMode\": \"HYBRID\",\n  \"experience\": \"0-2\",\n  \"deadline\": \"2026-12-31T23:59:59\",\n  \"companyId\": 1,\n  \"status\": \"ACTIVE\"\n}"
            }
          }
        },
        {
          "name": "List My Jobs",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": "{{baseUrl}}/api/recruiters/jobs?page=0&size=10&sortBy=createdAt&direction=desc&status=ACTIVE"
          }
        }
      ]
    },
    {
      "name": "Admin",
      "item": [
        {
          "name": "Admin Dashboard",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": "{{baseUrl}}/api/admin/dashboard"
          }
        }
      ]
    }
  ]
}
```

**Postman Variables to set:**
| Variable | Value |
|----------|-------|
| `baseUrl` | `http://localhost:8080` |
| `token` | (set from Login response, e.g. via a test script) |

---

## 5. Endpoint Reference (per-endpoint details)

### 5.1 `POST /api/auth/register` — Public
- **Auth:** None
- **Role:** None
- **Body:**
```json
{ "email": "student@example.com", "password": "secret123", "role": "STUDENT" }
```
- **Success 200:**
```json
{ "token": "<jwt>", "role": "STUDENT", "message": "Registration successful" }
```
- **Errors:** `400` duplicate email / invalid email / short password (field map)

### 5.2 `POST /api/auth/login` — Public
- **Auth:** None
- **Body:**
```json
{ "email": "student@example.com", "password": "secret123" }
```
- **Success 200:**
```json
{ "token": "<jwt>", "role": "STUDENT", "message": "Login successful" }
```
- **Errors:** `400` blank/invalid email (field map); `500` bad credentials (unhandled `BadCredentialsException`)

### 5.3 `POST /api/students/profile` — Protected (STUDENT/ADMIN)
- **Auth:** Bearer token
- **Body:**
```json
{
  "fullName": "Jane Doe",
  "phone": "9876543210",
  "department": "CSE",
  "branch": "CSE",
  "cgpa": "8.5",
  "resumeUrl": null,
  "skills": "Java,Spring",
  "graduationYear": "2026"
}
```
- **Success 200:** Saved `StudentProfile` JSON
- **Errors:** `403` no token / wrong role; `400` validation map

### 5.4 `GET /api/students/profile` — Protected (STUDENT/ADMIN)
- **Success 200:** `StudentProfile` JSON
- **Errors:** `403` unauthenticated; `400` "Profile not found"

### 5.5 `POST /api/students/profile/resume` — Protected (STUDENT/ADMIN), multipart
- **Auth:** Bearer token
- **Body:** `form-data` with key `resume` (file, PDF, ≤5MB)
- **Success 200:**
```json
{ "success": true, "message": "Resume received successfully. Storage is not yet implemented." }
```
- **Errors:** `400` missing file / empty / non-PDF / >5MB

### 5.6 `GET /api/students/jobs` — Protected (STUDENT/ADMIN reachable; RECRUITER blocked)
- **Query params:** `title, location, salaryMin, salaryMax, skills, companyId, employmentType, workMode, pageNumber, pageSize, sortBy, sortDirection`
- **Success 200:** Spring `Page<JobDTO>` (content, totalElements, totalPages …)
- **Errors:** `400` invalid pageNumber/pageSize/sortBy; `403` for RECRUITER

### 5.7 `GET /api/students/jobs/{id}` — Protected
- **Success 200:** `JobDetailDTO`
- **Errors:** `404` not found; `403` for RECRUITER

### 5.8 `GET /api/students/jobs/active/list` — Protected
- **Success 200:** `Page<JobDTO>` of active jobs

### 5.9 `POST /api/applications/{jobId}` — Protected (STUDENT)
- **Success 200:** `Application` JSON
- **Errors:** `400` job not found / not active / duplicate / no profile; `403` no token / wrong role

### 5.10 `GET /api/applications` — Protected (STUDENT)
- **Success 200:** `[Application, ...]`
- **Errors:** `403` unauthenticated / wrong role

### 5.11 `DELETE /api/applications/{applicationId}` — Protected (STUDENT)
- **Success 204:** empty body
- **Errors:** `403` not owner / unauthenticated; `409` not pending; `400` not found

### 5.12 `POST /api/recruiters/jobs` — Protected (RECRUITER/ADMIN)
- **Body:** see §5.6 sample (requires `companyId`, `deadline`, `title`, `description`, `location`, `employmentType`)
- **Success 200:** `Job` entity JSON
- **Errors:** `400` validation; `403` unauthenticated / wrong role

### 5.13 `GET /api/recruiters/jobs` — Protected (RECRUITER/ADMIN)
- **Query params:** `page, size, sortBy, direction, status, title`
- **Success 200:** `Page<JobDTO>` (own jobs only)
- **Errors:** `403` unauthenticated / wrong role

### 5.14 `GET /api/admin/dashboard` — Protected (ADMIN)
- **Success 200:** `"Admin dashboard ready"`
- **Errors:** `403` for non-ADMIN / unauthenticated

### 5.15 `POST /` — Protected (no mapping)
- **Success:** none. **Expected 403** (unauthenticated, no MVC handler, no `authenticationEntryPoint`).

---

## 6. JWT Login Flow Verification

1. **Register** a student → capture `token` from response.
2. **Login** → capture `token` + `role`.
3. Call `GET /api/students/profile` with `Authorization: Bearer <token>` → expect **200**.
4. Call same endpoint **without** token → expect **403**.
5. Register/login a **recruiter** → call `GET /api/recruiters/jobs` → expect **200**.
6. Call `GET /api/students/jobs` with recruiter token → expect **403** (unreachable due to URL-level rule).
7. Register/login an **admin** → call `GET /api/admin/dashboard` → expect **200**.

---

## 7. Multipart Resume Upload Verification

`POST /api/students/profile/resume` with `Content-Type: multipart/form-data`:
- Field name: `resume`
- Valid PDF, ≤ 5MB → **200** `{"success":true,...}`
- Missing file → **400** `{ "error": "Resume file is required" }`
- Empty file → **400** `{ "error": "Resume file must not be empty" }`
- `text/plain` → **400** `{ "error": "Resume must be a PDF (application/pdf)" }`
- >5MB → **400** `{ "error": "Resume file size must be <= 5 MB" }`

> ⚠️ Backend currently does **not** persist the resume. `StudentService.uploadResume` is a no-op. The response indicates storage is not implemented.

---

## 8. Pagination & Filtering Verification

`GET /api/students/jobs`:
- `pageNumber` (0-based), `pageSize` (1–100)
- `sortBy` whitelist: `createdAt, deadline, salaryMin, salaryMax, title`
- `sortDirection`: `asc` | `desc`
- Filters: `title, location, salaryMin, salaryMax, skills, companyId, employmentType, workMode`

`GET /api/recruiters/jobs`:
- `page`, `size`, `sortBy` (same whitelist), `direction`, `status`, `title`

**Validation to test:**
- `pageNumber=-1` → `400`
- `pageSize=0` or `>100` → `400`
- `sortBy=DROP_TABLE` → `400`
- blank `sortBy` → `400`

---

## 9. Validation Error Verification

`GlobalExceptionHandler` returns `400` with a field map for `MethodArgumentNotValidException`:
```json
{
  "fullName": "Full name is required",
  "phone": "Phone must be exactly 10 digits",
  "cgpa": "CGPA must be at most 10.0"
}
```
Test cases:
- `RegisterRequest`: blank email, invalid email, password < 6
- `LoginRequest`: blank email, invalid email, blank password
- `JobRequest`: blank title, blank description, blank location, blank employmentType, missing deadline, missing companyId, negative salary
- `StudentProfileRequest`: blank fullName, phone != 10 digits, cgpa outside [0,10]

---

## 10. Security Findings Summary

| Issue | Impact | Severity |
|-------|--------|----------|
| No `authenticationEntryPoint` → unauthenticated requests to protected APIs return **403** (not 401) | Confusing status semantics | Medium |
| `/api/students/**` URL rule excludes `RECRUITER`, so `StudentJobController` (`@PreAuthorize` allows RECRUITER) is **unreachable for RECRUITER** | Contract mismatch | High |
| CORS allows only `http://localhost:3000` | Vite dev (5173) browser calls blocked | Medium |
| `BadCredentialsException` not handled → login with wrong password returns **500** (should be 401/400) | Error handling gap | Medium |
| `POST /` returns **403** (no mapping, protected) | Expected, but no health/root endpoint | Low |

---

*This document is QA reference only. No production code or test files were modified.*
