# Frontend Integration Documentation

**Complete API integration guide for the Campus Job frontend.**

This document covers every REST endpoint with exact request/response schemas, validation rules,
error handling, pagination, file uploads, JWT auth flow, and role-based UI behavior.

---

## 📡 Table of Contents

1. [Base URL & Conventions](#-base-url--conventions)
2. [Global Error Format](#-global-error-format)
3. [Authentication (Public)](#-authentication-public)
   - Register
   - Login
4. [Job Endpoints](#-job-endpoints)
   - List/Filter Jobs (Paginated)
   - Job Details
   - Active Jobs
5. [Student Profile Endpoints](#-student-profile-endpoints)
   - Get Profile
   - Save/Update Profile
   - Upload Resume (multipart)
6. [Application Endpoints](#-application-endpoints)
   - Apply to Job
   - My Applications
   - Withdraw Application
7. [Recruiter Job Endpoints](#-recruiter-job-endpoints)
   - Create Job
   - List My Jobs (Paginated)
8. [Role-Based UI Behavior](#-role-based-ui-behavior)
9. [JWT Authentication Flow](#-jwt-authentication-flow)
10. [Pagination Examples](#-pagination-examples)
11. [File Upload Example](#-file-upload-example)
12. [Error Handling Patterns](#-error-handling-patterns)

---

## 🔗 Base URL & Conventions

| Environment | Base URL |
|-------------|----------|
| Local (dev) | `http://localhost:8080` |
| Docker | `http://localhost:8080` (via nginx proxy at `http://localhost:3000/api/...`) |

- **Default headers:** `Content-Type: application/json`, `Accept: application/json`
- **Auth header:** `Authorization: Bearer <token>`
- **Timestamps:** ISO 8601 strings (e.g., `2025-06-01T10:30:00`)
- **Money:** Salary values are in **INR** (rupees), e.g., `500000` = ₹5 LPA.
- The frontend uses a **centralized Axios instance** (`src/api/api.js`) that automatically
  attaches the JWT and normalizes errors.

---

## ⚠️ Global Error Format

All errors from the `GlobalExceptionHandler` follow this JSON shape:

```json
{
  "error": "Error message"
}
```

For **bean validation** errors (`MethodArgumentNotValidException`), the response is a field→message map:

```json
{
  "fullName": "Full name is required",
  "phone": "Phone must be exactly 10 digits"
}
```

The Axios response interceptor in `src/api/api.js` normalizes all errors into:

```js
{
  success: false,
  message: "Human readable message",
  status: 400,               // HTTP status
  details: { ... }           // original response body
}
```

### HTTP Status Codes

| Code | Meaning | Typical Cause |
|------|---------|---------------|
| `200` | OK | Successful request |
| `201` | Created | Resource created (not used currently) |
| `400` | Bad Request | Invalid input, validation failure, illegal argument |
| `401` | Unauthorized | Missing/invalid/expired JWT |
| `403` | Forbidden | Authenticated but wrong role |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Illegal state (e.g., duplicate application, withdraw non-pending) |
| `500` | Internal Server Error | Unhandled server exception |

---

## 🔐 Authentication (Public)

### 1. Register

| Field | Value |
|-------|-------|
| **URL** | `/api/auth/register` |
| **Method** | `POST` |
| **Authorization** | ❌ None (public) |
| **Headers** | `Content-Type: application/json` |

**Request JSON:**
```json
{
  "email": "student@example.com",
  "password": "secret123",
  "role": "STUDENT"
}
```

**Response JSON (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "role": "STUDENT",
  "message": "Registration successful"
}
```

**Validation Rules:**
| Field | Rule |
|-------|------|
| `email` | Required, valid email format |
| `password` | Required, min 6 characters |
| `role` | Required; must be one of `STUDENT`, `RECRUITER`, `ADMIN` |

**Possible Errors:**
| Status | Body |
|--------|------|
| `400` | `{ "error": "Email already exists" }` |
| `400` | `{ "email": "must be a well-formed email address" }` |
| `400` | `{ "password": "size must be between 6 and 2147483647" }` |

**React Axios Example:**
```jsx
import api from '../api/api';

const handleRegister = async (email, password, role) => {
  try {
    const res = await api.post('/api/auth/register', { email, password, role });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('role', res.data.role);
    return res.data;
  } catch (err) {
    // err.message is normalized by the interceptor
    throw new Error(err.message);
  }
};
```

---

### 2. Login

| Field | Value |
|-------|-------|
| **URL** | `/api/auth/login` |
| **Method** | `POST` |
| **Authorization** | ❌ None (public) |
| **Headers** | `Content-Type: application/json` |

**Request JSON:**
```json
{
  "email": "student@example.com",
  "password": "secret123"
}
```

**Response JSON (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "role": "STUDENT",
  "message": "Login successful"
}
```

**Validation Rules:**
| Field | Rule |
|-------|------|
| `email` | Required, valid email format |
| `password` | Required |

**Possible Errors:**
| Status | Body |
|--------|------|
| `401` | `{ "error": "Invalid email or password" }` |
| `400` | `{ "email": "must be a well-formed email address" }` |

**React Axios Example:**
```jsx
import api from '../api/api';

const handleLogin = async (email, password) => {
  try {
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('role', res.data.role);
    return res.data;
  } catch (err) {
    throw new Error(err.message); // "Invalid email or password"
  }
};
```

---

## 💼 Job Endpoints

### 3. List / Filter Jobs (Paginated)

| Field | Value |
|-------|-------|
| **URL** | `/api/students/jobs` |
| **Method** | `GET` |
| **Authorization** | ✅ Bearer token — `STUDENT`, `RECRUITER`, or `ADMIN` |
| **Headers** | `Authorization: Bearer <token>` |

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Search by job title |
| `location` | string | No | Filter by location |
| `salaryMin` | number | No | Minimum salary (INR) |
| `salaryMax` | number | No | Maximum salary (INR) |
| `skills` | string | No | Comma-separated required skills |
| `companyId` | number | No | Filter by company |
| `employmentType` | string | No | `FULL_TIME`, `PART_TIME`, `INTERNSHIP`, `CONTRACT` |
| `workMode` | string | No | `REMOTE`, `HYBRID`, `ONSITE` |
| `pageNumber` | number | No (default `0`) | 0-indexed page |
| `pageSize` | number | No (default `10`) | 1–100 |
| `sortBy` | string | No (default `createdAt`) | `createdAt`, `deadline`, `salaryMin`, `salaryMax`, `title` |
| `sortDirection` | string | No (default `desc`) | `asc` or `desc` |

**Example URL:**
```
GET /api/students/jobs?title=developer&location=Mumbai&salaryMin=500000&employmentType=FULL_TIME&pageNumber=0&pageSize=10&sortBy=createdAt&sortDirection=desc
```

**Response JSON (200):** Spring Data `Page<JobDTO>`
```json
{
  "content": [
    {
      "id": 1,
      "title": "Java Developer",
      "description": "Develop backend services...",
      "requiredSkills": "Java, Spring Boot, MySQL",
      "salaryMin": 500000,
      "salaryMax": 1200000,
      "location": "Mumbai",
      "employmentType": "FULL_TIME",
      "workMode": "HYBRID",
      "experience": "0-2",
      "deadline": "2025-12-31T23:59:59",
      "status": "ACTIVE",
      "createdAt": "2025-06-01T10:30:00",
      "company": {
        "id": 3,
        "name": "Acme Corp",
        "logo": null,
        "location": "Mumbai"
      }
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "sort": { "sorted": true, "unsorted": false },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "totalElements": 42,
  "totalPages": 5,
  "last": false,
  "first": true,
  "number": 0,
  "size": 10,
  "numberOfElements": 10,
  "empty": false
}
```

**Validation Rules (server-side):**
- `pageNumber` must be `>= 0`.
- `pageSize` must be between `1` and `100`.
- `sortBy` must be one of the whitelisted columns.
- `sortDirection` must be `asc` or `desc`.

**Possible Errors:**
| Status | Body |
|--------|------|
| `401` | `{ "error": "Unauthorized", "message": "Authentication required" }` |
| `400` | `{ "error": "pageNumber must be >= 0" }` |
| `400` | `{ "error": "pageSize must be between 1 and 100" }` |
| `400` | `{ "error": "sortBy is not allowed" }` |

**React Axios Example (with filters & pagination):**
```jsx
import api from '../api/api';

const fetchJobs = async (params) => {
  const res = await api.get('/api/students/jobs', { params });
  return res.data; // Page<JobDTO>
};

// Usage
const data = await fetchJobs({
  title: 'developer',
  location: 'Mumbai',
  salaryMin: 500000,
  employmentType: 'FULL_TIME',
  pageNumber: 0,
  pageSize: 10,
  sortBy: 'createdAt',
  sortDirection: 'desc',
});
console.log(data.content);   // job array
console.log(data.totalPages); // total pages
console.log(data.totalElements); // total count
```

---

### 4. Job Details

| Field | Value |
|-------|-------|
| **URL** | `/api/students/jobs/{id}` |
| **Method** | `GET` |
| **Authorization** | ✅ Bearer token — `STUDENT`, `RECRUITER`, or `ADMIN` |

**Path Parameter:** `id` — Job ID (number).

**Response JSON (200):** `JobDetailDTO`
```json
{
  "id": 1,
  "title": "Java Developer",
  "description": "Develop backend services...",
  "eligibility": "B.E/B.Tech in CS/IT",
  "requiredSkills": "Java, Spring Boot, MySQL",
  "salaryMin": 500000,
  "salaryMax": 1200000,
  "location": "Mumbai",
  "employmentType": "FULL_TIME",
  "workMode": "HYBRID",
  "experience": "0-2",
  "deadline": "2025-12-31T23:59:59",
  "status": "ACTIVE",
  "createdAt": "2025-06-01T10:30:00",
  "updatedAt": null,
  "company": {
    "id": 3,
    "name": "Acme Corp",
    "industry": "IT Services",
    "website": "https://acme.com",
    "location": "Mumbai",
    "description": "Leading tech company",
    "logo": null,
    "createdAt": "2025-01-15T09:00:00"
  }
}
```

**Possible Errors:**
| Status | Body |
|--------|------|
| `401` | Authentication required |
| `404` | `{ "error": "Job not found with id: 999" }` |

**React Axios Example:**
```jsx
import api from '../api/api';

const getJobById = async (jobId) => {
  const res = await api.get(`/api/students/jobs/${jobId}`);
  return res.data; // JobDetailDTO
};
```

---

### 5. Active Jobs

| Field | Value |
|-------|-------|
| **URL** | `/api/students/jobs/active/list` |
| **Method** | `GET` |
| **Authorization** | ✅ Bearer token — `STUDENT`, `RECRUITER`, or `ADMIN` |

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `pageNumber` | number | No (default `0`) | 0-indexed page |
| `pageSize` | number | No (default `10`) | Page size |

**Response JSON (200):** `Page<JobDTO>` — same shape as endpoint #3, filtered to `status=ACTIVE`.

**React Axios Example:**
```jsx
import api from '../api/api';

const getActiveJobs = async (pageNumber = 0, pageSize = 10) => {
  const res = await api.get('/api/students/jobs/active/list', {
    params: { pageNumber, pageSize },
  });
  return res.data;
};
```

---

## 👤 Student Profile Endpoints

> All endpoints below require **`STUDENT`** role.

### 6. Get Profile

| Field | Value |
|-------|-------|
| **URL** | `/api/students/profile` |
| **Method** | `GET` |
| **Authorization** | ✅ Bearer token — `STUDENT` |

**Response JSON (200):** `StudentProfile` entity
```json
{
  "id": 1,
  "user": {
    "id": 2,
    "email": "student@example.com",
    "password": null,
    "role": "STUDENT",
    "enabled": true
  },
  "fullName": "John Doe",
  "phone": "9876543210",
  "department": "Engineering",
  "branch": "Computer Science",
  "cgpa": "8.5",
  "resumeUrl": null,
  "skills": "React, Spring Boot",
  "graduationYear": "2026"
}
```

> ⚠️ **Note:** The frontend `StudentProfile.jsx` handles the case where the profile
> doesn't exist yet (returns `null`/empty object) by showing an empty form.

**Possible Errors:**
| Status | Body |
|--------|------|
| `401` | Authentication required |
| `403` | `{ "error": "Access Denied" }` (non-student role) |
| `400` | `{ "error": "Profile not found" }` |

**React Axios Example:**
```jsx
import api from '../api/api';

const getStudentProfile = async () => {
  const res = await api.get('/api/students/profile');
  return res.data;
};
```

---

### 7. Save / Update Profile

| Field | Value |
|-------|-------|
| **URL** | `/api/students/profile` |
| **Method** | `POST` |
| **Authorization** | ✅ Bearer token — `STUDENT` |
| **Headers** | `Content-Type: application/json` |

**Request JSON:** `StudentProfileRequest`
```json
{
  "fullName": "John Doe",
  "phone": "9876543210",
  "department": "Engineering",
  "branch": "Computer Science",
  "cgpa": "8.5",
  "resumeUrl": "https://example.com/resume.pdf",
  "skills": "React, Spring Boot, MySQL",
  "graduationYear": "2026"
}
```

**Response JSON (200):** Updated `StudentProfile` entity (same shape as #6).

**Validation Rules:**
| Field | Rule |
|-------|------|
| `fullName` | Required |
| `phone` | Exactly 10 digits (`^[0-9]{10}$`) |
| `cgpa` | Between `0.0` and `10.0` |
| Others | Optional |

**Possible Errors:**
| Status | Body |
|--------|------|
| `400` | `{ "fullName": "Full name is required" }` |
| `400` | `{ "phone": "Phone must be exactly 10 digits" }` |
| `400` | `{ "cgpa": "CGPA must be at most 10.0" }` |

**React Axios Example:**
```jsx
import api from '../api/api';

const saveStudentProfile = async (profileData) => {
  const res = await api.post('/api/students/profile', profileData);
  return res.data;
};

// Usage
await saveStudentProfile({
  fullName: 'John Doe',
  phone: '9876543210',
  branch: 'Computer Science',
  cgpa: 8.5,
  graduationYear: 2026,
  skills: 'React, Spring Boot',
});
```

---

### 8. Upload Resume (File Upload)

| Field | Value |
|-------|-------|
| **URL** | `/api/students/profile/resume` |
| **Method** | `POST` |
| **Authorization** | ✅ Bearer token — `STUDENT` |
| **Headers** | `Content-Type: multipart/form-data` |
| **Body** | Form-data field named `resume` (file) |

**Constraints:**
- File **required** (must not be `null` or empty).
- Max size: **5 MB**.
- Content-Type must be `application/pdf`.

**Response JSON (200):**
```json
{
  "success": true,
  "message": "Resume received successfully. Storage is not yet implemented."
}
```

> ⚠️ **Important:** Resume **persistence is not implemented** yet. The backend validates
> the file but does not store it. This is tracked as a known limitation.

**Possible Errors:**
| Status | Body |
|--------|------|
| `400` | `{ "error": "Resume file is required" }` |
| `400` | `{ "error": "Resume file must not be empty" }` |
| `400` | `{ "error": "Resume file size must be <= 5 MB" }` |
| `400` | `{ "error": "Resume must be a PDF (application/pdf)" }` |
| `415` | Unsupported Media Type (if not multipart) |

**React Axios Example (File Upload):**
```jsx
import api from '../api/api';

const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);

  const res = await api.post('/api/students/profile/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// Usage in a React component
const onFileSelect = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Client-side validation
  if (file.type !== 'application/pdf') {
    toast.error('Please upload a PDF file');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('File must be <= 5 MB');
    return;
  }

  try {
    const result = await uploadResume(file);
    toast.success(result.message);
  } catch (err) {
    toast.error(err.message);
  }
};
```

---

## 📋 Application Endpoints

> All endpoints require **`STUDENT`** role.

### 9. Apply to Job

| Field | Value |
|-------|-------|
| **URL** | `/api/applications/{jobId}` |
| **Method** | `POST` |
| **Authorization** | ✅ Bearer token — `STUDENT` |
| **Body** | Empty (no request body) |

**Response JSON (200):** `Application` entity
```json
{
  "id": 12,
  "student": {
    "id": 1,
    "fullName": "John Doe",
    "phone": "9876543210",
    "department": "Engineering",
    "branch": "Computer Science",
    "cgpa": "8.5",
    "resumeUrl": null,
    "skills": "React, Spring Boot",
    "graduationYear": "2026"
  },
  "job": {
    "id": 1,
    "title": "Java Developer",
    "description": "Develop backend services...",
    "eligibility": "B.E/B.Tech in CS/IT",
    "requiredSkills": "Java, Spring Boot, MySQL",
    "salaryMin": 500000,
    "salaryMax": 1200000,
    "location": "Mumbai",
    "employmentType": "FULL_TIME",
    "workMode": "HYBRID",
    "experience": "0-2",
    "deadline": "2025-12-31T23:59:59",
    "status": "ACTIVE",
    "createdAt": "2025-06-01T10:30:00",
    "updatedAt": null,
    "company": { "id": 3, "name": "Acme Corp", "logo": null, "location": "Mumbai" },
    "recruiter": null
  },
  "status": "PENDING",
  "appliedAt": "2025-06-10T14:22:10.123456"
}
```

**Business Rules:**
- Job must exist.
- Job must have `status = ACTIVE`.
- Student must have a profile.
- **No duplicate applications** — applying twice returns an error.

**Possible Errors:**
| Status | Body |
|--------|------|
| `400` | `{ "error": "Job not found" }` |
| `400` | `{ "error": "Job is not active" }` |
| `400` | `{ "error": "Profile not found" }` (no student profile) |
| `409` | `{ "error": "Application already exists for this job" }` |

**React Axios Example:**
```jsx
import api from '../api/api';

const applyToJob = async (jobId) => {
  const res = await api.post(`/api/applications/${jobId}`);
  return res.data;
};

// Usage (from JobDetails page)
const onApply = async () => {
  setApplying(true);
  try {
    await applyToJob(job.id);
    toast.success('Applied successfully');
    setApplied(true);
  } catch (err) {
    toast.error(err.message);
  } finally {
    setApplying(false);
  }
};
```

---

### 10. My Applications

| Field | Value |
|-------|-------|
| **URL** | `/api/applications` |
| **Method** | `GET` |
| **Authorization** | ✅ Bearer token — `STUDENT` |

**Response JSON (200):** Array of `Application` entities
```json
[
  {
    "id": 12,
    "student": { "id": 1, "fullName": "John Doe" },
    "job": {
      "id": 1,
      "title": "Java Developer",
      "description": "...",
      "salaryMin": 500000,
      "salaryMax": 1200000,
      "location": "Mumbai",
      "employmentType": "FULL_TIME",
      "workMode": "HYBRID",
      "experience": "0-2",
      "deadline": "2025-12-31T23:59:59",
      "status": "ACTIVE",
      "company": { "id": 3, "name": "Acme Corp", "logo": null, "location": "Mumbai" }
    },
    "status": "PENDING",
    "appliedAt": "2025-06-10T14:22:10.123456"
  }
]
```

**Possible Errors:**
| Status | Body |
|--------|------|
| `401` | Authentication required |
| `400` | `{ "error": "Profile not found" }` |

**React Axios Example:**
```jsx
import api from '../api/api';

const getMyApplications = async () => {
  const res = await api.get('/api/applications');
  return res.data; // array
};
```

---

### 11. Withdraw Application

| Field | Value |
|-------|-------|
| **URL** | `/api/applications/{applicationId}` |
| **Method** | `DELETE` |
| **Authorization** | ✅ Bearer token — `STUDENT` |

**Response:** `204 No Content` (empty body).

**Business Rules:**
- Application must belong to the authenticated student (ownership check).
- Application status must be `PENDING`.

**Possible Errors:**
| Status | Body |
|--------|------|
| `400` | `{ "error": "Application not found" }` |
| `403` | `{ "error": "Forbidden" }` (not owner) |
| `409` | `{ "error": "Application cannot be withdrawn in its current status" }` |

**React Axios Example:**
```jsx
import api from '../api/api';

const withdrawApplication = async (applicationId) => {
  await api.delete(`/api/applications/${applicationId}`);
};
```

> ⚠️ **Note:** The current `frontend/src/services/applicationService.js` still has
> `withdrawApplication` as a TODO. The backend endpoint (`DELETE /api/applications/{id}`)
> **is implemented**. Update the service to call it:
> ```js
> export const withdrawApplication = async (applicationId) => {
>   const res = await api.delete(`/api/applications/${applicationId}`);
>   return res.data;
> };
> ```

---

## 🏢 Recruiter Job Endpoints

> All endpoints require **`RECRUITER`** role (or `ADMIN`).

### 12. Create Job

| Field | Value |
|-------|-------|
| **URL** | `/api/recruiters/jobs` |
| **Method** | `POST` |
| **Authorization** | ✅ Bearer token — `RECRUITER` |
| **Headers** | `Content-Type: application/json` |

**Request JSON:** `JobRequest`
```json
{
  "title": "Backend Developer",
  "description": "Build REST APIs with Spring Boot",
  "eligibility": "B.Tech CS/IT",
  "requiredSkills": "Java, Spring Boot, Hibernate",
  "location": "Pune",
  "salaryMin": 600000,
  "salaryMax": 1500000,
  "employmentType": "FULL_TIME",
  "workMode": "HYBRID",
  "experience": "0-2",
  "deadline": "2025-12-31T23:59:59",
  "companyId": 3,
  "status": "ACTIVE"
}
```

**Response JSON (200):** `Job` entity
```json
{
  "id": 15,
  "title": "Backend Developer",
  "description": "Build REST APIs with Spring Boot",
  "eligibility": "B.Tech CS/IT",
  "requiredSkills": "Java, Spring Boot, Hibernate",
  "salaryMin": 600000,
  "salaryMax": 1500000,
  "location": "Pune",
  "employmentType": "FULL_TIME",
  "workMode": "HYBRID",
  "experience": "0-2",
  "deadline": "2025-12-31T23:59:59",
  "status": "ACTIVE",
  "createdAt": "2025-06-11T09:00:00",
  "updatedAt": null,
  "company": { "id": 3, "name": "Acme Corp", "industry": "IT", "website": "https://acme.com", "location": "Pune", "description": "...", "logo": null, "createdAt": "2025-01-15T09:00:00" },
  "recruiter": { "id": 5, "email": "recruiter@example.com", "role": "RECRUITER", "enabled": true }
}
```

**Validation Rules:**
| Field | Rule |
|-------|------|
| `title` | Required |
| `description` | Required |
| `location` | Required |
| `employmentType` | Required |
| `salaryMin` | Must be positive |
| `salaryMax` | Must be positive |
| `deadline` | Required |
| `companyId` | Required (must exist) |

**Possible Errors:**
| Status | Body |
|--------|------|
| `400` | `{ "error": "Company not found" }` |
| `400` | `{ "error": "User not found" }` |
| `400` | `{ "title": "Job title is required" }` |
| `400` | `{ "salaryMin": "Minimum salary must be positive" }` |

**React Axios Example:**
```jsx
import api from '../api/api';

const createJob = async (jobData) => {
  const res = await api.post('/api/recruiters/jobs', jobData);
  return res.data;
};

// Usage
await createJob({
  title: 'Backend Developer',
  description: 'Build REST APIs',
  eligibility: 'B.Tech CS/IT',
  requiredSkills: 'Java, Spring Boot',
  location: 'Pune',
  salaryMin: 600000,
  salaryMax: 1500000,
  employmentType: 'FULL_TIME',
  workMode: 'HYBRID',
  experience: '0-2',
  deadline: '2025-12-31T23:59:59',
  companyId: 3,
  status: 'ACTIVE',
});
```

---

### 13. List My Jobs (Paginated)

| Field | Value |
|-------|-------|
| **URL** | `/api/recruiters/jobs` |
| **Method** | `GET` |
| **Authorization** | ✅ Bearer token — `RECRUITER` |

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | number | No (default `0`) | 0-indexed page |
| `size` | number | No (default `10`) | 1–100 |
| `sortBy` | string | No (default `createdAt`) | Whitelisted: `createdAt`, `deadline`, `salaryMin`, `salaryMax`, `title` |
| `direction` | string | No (default `desc`) | `asc` or `desc` |
| `status` | string | No | Job status filter (`ACTIVE`, `CLOSED`, `DRAFT`) |
| `title` | string | No | Job title search |

**Response JSON (200):** `Page<JobDTO>` — same shape as endpoint #3, but scoped to the authenticated recruiter's jobs.

**React Axios Example:**
```jsx
import api from '../api/api';

const getRecruiterJobs = async (params = {}) => {
  const res = await api.get('/api/recruiters/jobs', { params });
  return res.data; // Page<JobDTO>
};

// Usage
const data = await getRecruiterJobs({
  page: 0,
  size: 10,
  sortBy: 'createdAt',
  direction: 'desc',
  status: 'ACTIVE',
});
```

---

## 👥 Role-Based UI Behavior

The frontend stores the user's role in `localStorage` (`role` key) after login/registration.

### Routing & Guards (`src/App.jsx`)
```jsx
const token = localStorage.getItem('token');
const isAuthed = Boolean(token);

// Public routes
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />

// Protected routes
<Route path="/dashboard" element={isAuthed ? <DashboardPage /> : <Navigate to="/login" />} />
<Route path="/jobs" element={isAuthed ? <JobList /> : <Navigate to="/login" />} />
<Route path="/jobs/:jobId" element={isAuthed ? <JobDetails /> : <Navigate to="/login" />} />
```

### Recommended Role-Based Menu

```jsx
const role = localStorage.getItem('role'); // 'STUDENT' | 'RECRUITER' | 'ADMIN'

const menuItems = {
  STUDENT: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Browse Jobs', path: '/jobs' },
    { label: 'My Applications', path: '/applications' },
    { label: 'My Profile', path: '/profile' },
    { label: 'Resume', path: '/resume' },
  ],
  RECRUITER: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Post Job', path: '/recruiter/jobs/new' },
    { label: 'Manage Jobs', path: '/recruiter/jobs' },
    { label: 'Applications', path: '/recruiter/applications' },
    { label: 'Company Profile', path: '/recruiter/company' },
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Users', path: '/admin/users' },
    { label: 'Companies', path: '/admin/companies' },
    { label: 'Analytics', path: '/admin/analytics' },
    { label: 'Reports', path: '/admin/reports' },
    { label: 'Audit Logs', path: '/admin/audit-logs' },
  ],
};

const links = menuItems[role] ?? [];
```

### Conditional UI Behaviors

| Feature | STUDENT | RECRUITER | ADMIN |
|---------|:-------:|:---------:|:-----:|
| Browse & search jobs | ✅ | ✅ | ✅ |
| View job details | ✅ | ✅ | ✅ |
| Apply to job | ✅ | ❌ | ❌ |
| Manage student profile | ✅ | ❌ | ❌ |
| Upload resume | ✅ | ❌ | ❌ |
| My applications / withdraw | ✅ | ❌ | ❌ |
| Post/manage jobs | ❌ | ✅ | ✅ (via API) |
| Company profile | ❌ | ✅ | ✅ (via API) |
| Admin dashboard | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Analytics & reports | ❌ | ❌ | ✅ |

### Guarding by Role (recommended pattern)
```jsx
const RoleGuard = ({ allowedRoles, children }) => {
  const role = localStorage.getItem('role');
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Usage
<Route path="/recruiter/jobs/new" element={
  <RoleGuard allowedRoles={['RECRUITER', 'ADMIN']}>
    <PostJob />
  </RoleGuard>
} />
```

---

## 🔑 JWT Authentication Flow

### Login/Register → Store Token
```js
localStorage.setItem('token', response.data.token);
localStorage.setItem('role', response.data.role);
```

### Automatic Token Attachment (`src/api/api.js`)
```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 401 Auto-Logout
```js
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Request failed';

    return Promise.reject({
      success: false,
      message,
      status: status ?? 500,
      details: error?.response?.data,
    });
  }
);
```

### JWT Refresh Flow

> ⚠️ **Current backend has NO refresh token endpoint.** The token expires after
> `app.jwt.expiration-ms` (default **24 hours**). The frontend handles expiry by:
> 1. Receiving `401` on an API call.
> 2. The interceptor clears auth storage.
> 3. Redirects to `/login`.

**To implement full refresh-token flow** (future scope), follow this pattern:

1. **Backend:** Add `POST /api/auth/refresh` that accepts a refresh token and returns a new access token.
2. **Frontend:** Add a refresh interceptor:

```js
let isRefreshing = false;
let waitQueue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    if (status === 401 && !originalRequest._retry && !originalRequest.url.includes('/login')) {
      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve, reject) => {
          waitQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
        localStorage.setItem('token', res.data.token);
        if (res.data.refreshToken) {
          localStorage.setItem('refreshToken', res.data.refreshToken);
        }

        // Replay queued requests
        waitQueue.forEach(({ resolve }) => resolve());
        waitQueue = [];

        return api(originalRequest);
      } catch (refreshError) {
        waitQueue.forEach(({ reject }) => reject(refreshError));
        waitQueue = [];
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.assign('/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

---

## 📄 Pagination Examples

The backend uses **Spring Data `Page<T>`** responses.

### Page Response Structure
```json
{
  "content": [ ... ],       // array of items
  "totalElements": 42,      // total items across all pages
  "totalPages": 5,          // total pages
  "number": 0,              // current page (0-indexed)
  "size": 10,               // page size
  "numberOfElements": 10,   // items on this page
  "first": true,
  "last": false,
  "empty": false
}
```

### React Pagination Hook
```jsx
import { useEffect, useState } from 'react';
import api from '../api/api';

const usePaginatedJobs = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/students/jobs', {
        params: { pageNumber: page, pageSize: size, sortBy: 'createdAt', sortDirection: 'desc' },
      });
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [page, size]);

  const totalPages = data?.totalPages ?? 0;
  const isFirst = page === 0;
  const isLast = page + 1 >= totalPages;

  return {
    jobs: data?.content ?? [],
    totalElements: data?.totalElements ?? 0,
    totalPages,
    page,
    size,
    setPage,
    setSize,
    isFirst,
    isLast,
    loading,
    error,
    refresh: fetchJobs,
  };
};
```

### Pagination Controls
```jsx
<button disabled={isFirst} onClick={() => setPage(page - 1)}>Previous</button>
<span>Page {page + 1} of {totalPages}</span>
<button disabled={isLast} onClick={() => setPage(page + 1)}>Next</button>

<select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}>
  {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
</select>
```

> The existing `frontend/src/components/jobs/Pagination.jsx` already implements this UI.

---

## 📤 File Upload Example

The resume upload uses `multipart/form-data` with the field name **`resume`**.

```jsx
const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);

  const res = await api.post('/api/students/profile/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // axios will set the boundary automatically
  });
  return res.data;
};
```

### Complete React Component
```jsx
import { useRef, useState } from 'react';
import { toast } from 'react-toastify';

const ResumeUpload = () => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleUpload = async (file) => {
    // Client-side validation mirrors server rules
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be <= 5 MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await api.post('/api/students/profile/resume', formData);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
};
```

---

## 🧯 Error Handling Patterns

### 1. Global Error Normalization (already in `src/api/api.js`)
Every rejected promise has `{ success, message, status, details }`.

### 2. Page-Level Try/Catch
```jsx
const fetchData = async () => {
  setLoading(true);
  setError('');
  try {
    const data = await getJobs();
    setJobs(data);
  } catch (e) {
    setError(e.message); // normalized by interceptor
  } finally {
    setLoading(false);
  }
};
```

### 3. Toast Notifications (user feedback)
```jsx
import { toast } from 'react-toastify';

try {
  await applyToJob(jobId);
  toast.success('Applied successfully');
} catch (err) {
  toast.error(err.message); // e.g., "Application already exists for this job"
}
```

### 4. Reusable Error State Component
```jsx
import ErrorState from '../components/jobs/ErrorState';

{error ? (
  <ErrorState
    title="Error loading jobs"
    message={error}
    loading={loading}
    onRetry={fetchJobs}
  />
) : null}
```

### 5. Handle 401 vs 403 Differently
```js
catch (err) {
  if (err.status === 401) {
    // Interceptor already redirected to /login
  } else if (err.status === 403) {
    toast.error('You do not have permission to perform this action');
    // Optionally navigate to a "Forbidden" page
  } else if (err.status === 400) {
    // Validation error — show field errors
    console.log(err.details); // { field: "message" }
  } else {
    toast.error(err.message);
  }
}
```

---

## ✅ Summary of Service Files

| Service File | Endpoints Used |
|--------------|----------------|
| `src/services/jobService.js` | `getJobs`, `getJobById`, `searchJobs`, `refreshJobs` |
| `src/services/applicationService.js` | `applyToJob`, `getMyApplications`, `withdrawApplication` (TODO) |
| `src/services/studentProfileService.js` | `getStudentProfile`, `saveStudentProfile` |
| `src/services/recruiterJobService.js` | `createJob`, `getRecruiterJobs`, `getRecruiterJob`, `updateRecruiterJob`, `deleteRecruiterJob` (last 3 are TODO) |
| `src/api/api.js` | Centralized Axios instance + interceptors |

> ⚠️ **Known TODO items in frontend services:**
> - `withdrawApplication` — backend endpoint exists (`DELETE /api/applications/{id}`); wire it up.
> - `getRecruiterJob` / `updateRecruiterJob` / `deleteRecruiterJob` — backend endpoints not yet implemented in `RecruiterJobController`.

---

<div align="center">

**Integration Guide End** · See [api-docs.md](api-docs.md) for the full backend API reference.

</div>
