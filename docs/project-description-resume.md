# 🎓 Campus Job — Resume-Worthy Project Description

> A production-grade, full-stack campus job and placement platform (Spring Boot 3 + React) with
> role-based access control, JWT security, dynamic job search, online applications, and
> Dockerized deployment — backed by 118 passing automated tests.

---

## 📋 Table of Contents

1. [Problem Statement](#-problem-statement)
2. [Architecture](#-architecture)
3. [Tech Stack](#-tech-stack)
4. [Features](#-features)
5. [Security](#-security)
6. [Performance](#-performance)
7. [Challenges & Solutions](#-challenges--solutions)
8. [My Contributions](#-my-contributions)
9. [Key Learnings](#-key-learnings)
10. [Resume Description — 100 Words](#-resume-description--100-words)
11. [Resume Description — 50 Words](#-resume-description--50-words)
12. [LinkedIn Post](#-linkedin-post)
13. [GitHub Description](#-github-description)
14. [Interview Explanation — 5 Minutes](#-interview-explanation--5-minutes)
15. [HR Explanation — 1 Minute](#-hr-explanation--1-minute)

---

## 🎯 Problem Statement

College placement cells traditionally manage the campus recruitment process through manual,
fragmented workflows — spreadsheets for student data, email chains for job postings, and paper
forms for applications. This creates several critical problems:

- **Missed deadlines** — students don't see job postings until it's too late.
- **Inefficient tracking** — recruiters struggle to track applicants across multiple job drives.
- **No visibility** — admins have no centralized view of placement statistics.
- **Data inconsistency** — student profiles are duplicated or outdated across channels.
- **No central authority** — no clear role separation between students, recruiters, and admins.

The **solution** was a centralized, role-based web platform where:
- **Students** browse filtered job listings, apply online, and track applications.
- **Recruiters** post and manage jobs, and review applicants.
- **Admins** govern users, companies, and analytics.

All three roles share **one secure JWT-authenticated API** with role-specific permissions.

---

## 🏗️ Architecture

### Layered Architecture (Controller → Service → Repository)

```
┌──────────────────────────────────────────────┐
│              REST Controllers                │  HTTP, validation, DTO mapping
├──────────────────────────────────────────────┤
│                 Services                     │  Business logic, transactions
├──────────────────────────────────────────────┤
│            Repositories (JPA)                │  Data access, specs, paging
├──────────────────────────────────────────────┤
│                 MySQL 8                       │  Persistence (Hibernate)
└──────────────────────────────────────────────┘
```

### Key Design Decisions
- **Controller–Service–Repository** — clean separation of concerns; controllers stay thin.
- **DTO + MapperService** — API responses never leak JPA entities; decouples internal model.
- **Stateless JWT** — no server-side session storage; scales horizontally.
- **JPA Specifications** — dynamic, type-safe query building for multi-filter search.
- **Method-level security** — `@PreAuthorize` for granular role enforcement.
- **Global `@RestControllerAdvice`** — standardized, consistent error responses.
- **Dockerized 3-tier deployment** — MySQL, Spring Boot, React/Nginx with health checks.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Language | **Java 17** | Core language |
| Framework | **Spring Boot 3.2.5** | Application framework |
| Security | **Spring Security 6** | Authentication & authorization |
| Auth Tokens | **JWT (jjwt 0.12.5)** | Stateless token auth (HMAC-SHA) |
| Persistence | **Spring Data JPA / Hibernate** | ORM |
| Database | **MySQL 8** | Relational storage |
| Query Building | **JPA Specifications** | Dynamic filters |
| Validation | **Bean Validation (Jakarta)** | DTO validation |
| Docs | **springdoc-openapi (Swagger)** | Interactive API docs |
| Testing | **JUnit 5 + Mockito** | Unit & integration tests (67) |
| Build | **Maven** | Build & dependencies |
| DevOps | **Docker, Docker Compose, Nginx** | Containerized deployment |
| Frontend (companion) | **React 18, Vite, Axios** | SPA consumed by API |

---

## ✨ Features

### Authentication & Authorization
- JWT-based **stateless authentication** (`/api/auth/register`, `/api/auth/login`).
- **Role-Based Access Control** with 3 roles: `STUDENT`, `RECRUITER`, `ADMIN`.
- BCrypt password hashing.
- Custom `AuthenticationEntryPoint` returning proper **401** for unauthenticated requests.
- CORS configuration + CSRF disabled for the stateless API.

### Job Management
- **CRUD** for job postings (recruiter-owned).
- **Advanced search**: title, location, salary range, employment type, work mode, skills, company.
- **Server-side pagination & sorting** with a whitelisted column set (prevents injection).

### Application Workflow
- One-click job application with **duplicate-application prevention**.
- Owned-only withdrawal (IDOR-safe) — students can only withdraw their own pending applications.

### Student Profiles
- Create/update detailed student profiles (name, phone, CGPA, skills, graduation year).
- Resume upload with strict validation (PDF, ≤ 5 MB).

### Admin / Reporting
- Admin, recruiter, and student dashboard endpoints with role-gated access.

### Quality & Documentation
- **67 automated tests** (JUnit 5 + Mockito) with `BUILD SUCCESS`.
- **Full Swagger/OpenAPI** documentation on every endpoint.

---

## 🔒 Security

| Security Concern | Implementation |
|------------------|----------------|
| **Password storage** | BCrypt (`BCryptPasswordEncoder`) |
| **Session handling** | Stateless JWT (HMAC-SHA, 24h expiry, configurable) |
| **Authorization** | URL matchers + method-level `@PreAuthorize` per role |
| **Unhandled auth** | Custom `AuthenticationEntryPoint` → `401` JSON |
| **IDOR / ownership** | Server-side ownership checks (e.g., withdraw only own application) |
| **Duplicate actions** | Duplicate-application prevention at service layer |
| **Injection vector (sort)** | Whitelisted sortable columns only |
| **Error leak** | Global handler sanitizes responses; production profile hides stack traces |
| **CORS** | Restricted to configured origins |
| **CSRF** | Disabled intentionally (stateless JWT API) |
| **Secrets** | Externalized via env vars; no hardcoded secrets in prod profile |

---

## ⚡ Performance

- **Server-side pagination** — only the requested page travels over the wire (`Pageable`).
- **JPA Specifications** — filters compile to efficient SQL predicates at the DB layer.
- **Lazy loading** — `FetchType.LAZY` on relationships avoids N+1 on list queries.
- **DTO mapping** — leaner payloads; only required fields exposed.
- **HikariCP tuning** — configurable pool (default 20 max / 5 min) for concurrent load.
- **Indexed derived queries** — repository methods leverage DB indexes.
- **Docker health checks** — readiness/liveness for graceful scaling.

---

## 🧗 Challenges & Solutions

**Challenge:** Dynamic multi-field job search (title + location + salary + skills + type).
**Solution:** Implemented **JPA Specifications** to build type-safe predicate chains dynamically, keeping the query efficient and the controller clean.

**Challenge:** Returning the right status code for unauthenticated calls (403 vs 401).
**Solution:** Added a custom `AuthenticationEntryPoint` so unauthenticated requests return **401** with a consistent JSON body, and role-violations return **403**.

**Challenge:** Test isolation with the full Spring Security chain.
**Solution:** Used `@WebMvcTest` + mocked JWT infrastructure beans + `@WithMockUser`, and `@SpringBootTest` for the security chain — 67 tests all green.

**Challenge:** Preventing duplicate applications and unauthorized withdrawals.
**Solution:** Enforced server-side checks (unique student+job check, ownership + status validation) in the service layer, not the client.

**Challenge:** Keeping secrets out of source control while supporting dev and production.
**Solution:** Externalized all configuration to `${ENV_VAR:default}` placeholders; a dedicated `application-prod.properties` uses env-only values.

**Challenge:** Reproducible, production-ready deployment.
**Solution:** Multi-stage Docker builds (Maven + JRE, Node + nginx), Docker Compose orchestration with health checks, MySQL volume persistence, and an HTTPS nginx reverse proxy.

---

## 👨‍💻 My Contributions

- **Designed & built** the complete layered backend (Controllers, Services, DTOs, Repositories, MapperService) on Spring Boot 3.
- **Implemented JWT authentication & RBAC** with Spring Security 6 (`JwtAuthenticationFilter`, `JwtUtil`, `CustomUserDetailsService`).
- **Engineered dynamic job search** with JPA Specifications, pagination, and safe sorting.
- **Built the application workflow** with duplicate-prevention and ownership-safe withdrawal.
- **Authored 67 unit/integration tests** covering controllers, services, and security — all passing.
- **Containerized the application** with multi-stage Dockerfiles and Docker Compose (MySQL + backend + nginx).
- **Documented the API** with full Swagger/OpenAPI annotations on every controller.
- **Produced** production hardening, deployment guides (AWS EC2, Render, Railway, DigitalOcean), frontend integration docs, and a production-readiness audit.

---

## 💡 Key Learnings

- **Spring Security filter chain** ordering and how `addFilterBefore` integrates JWT auth.
- **Stateless JWT design** — trade-offs, token expiry, and frontend interceptor patterns.
- **DTO pattern** prevents entity coupling and shrinks API payloads.
- **JPA Specifications** enable clean dynamic queries without string-based JPQL concatenation.
- **Testing with MockMvc** and managing the security context in `@WebMvcTest` / `@SpringBootTest`.
- **Production hardening** — env-based config, secret management, disabled Swagger, sanitized errors.
- **Docker multi-stage builds** and health-check-driven orchestration best practices.
- **401 vs 403 distinction** and how an `AuthenticationEntryPoint` controls it.

---

## 📄 Resume Description — (100 Words)

> **Campus Job**
>
> Built a full-stack, role-based campus placement platform with Spring Boot 3, React, and MySQL. Architected a layered backend (Controller–Service–Repository) with DTO mapping and JPA Specifications for dynamic multi-filter job search with pagination and safe sorting. Implemented stateless JWT authentication and role-based access control (Student/Recruiter/Admin) using Spring Security 6, BCrypt, and a custom authentication entry point. Delivered an online application workflow with duplicate and unauthorized-withdrawal prevention. Authored 118 JUnit/Mockito tests (all passing) and containerized the stack with Docker Compose and nginx reverse proxy. Added full Swagger documentation and produced production deployment guides for AWS EC2, Render, Railway, and DigitalOcean.

---

## 📄 Resume Description — (50 Words)

> **Campus Job** — A role-based campus recruitment platform using Spring Boot 3, JWT, and MySQL. Implemented layered REST APIs, JPA Specifications-driven job search with pagination, Spring Security RBAC, and ownership-safe applications. Wrote 118 JUnit/Mockito tests and containerized the stack with Docker Compose and nginx.

---

## 💼 LinkedIn Post

🎉 **Excited to share my latest project: Campus Job!** 🎓

I built a **production-grade, full-stack campus placement and recruitment platform** connecting students, recruiters, and campus placement cells.

**Backend:** Spring Boot 3, Spring Security 6, JWT, JPA/Hibernate, MySQL
**Frontend:** React 18 + Vite
**DevOps:** Docker Compose, Nginx, HTTPS-ready

**Highlights:**
✅ Role-Based Access Control (Student / Recruiter / Admin)
✅ Stateless JWT auth with BCrypt + custom 401 entry point
✅ Dynamic multi-filter job search via JPA Specifications
✅ Online applications with duplicate & unauthorized-withdrawal prevention
✅ **118 automated tests** (JUnit 5 + Mockito) — all passing
✅ Full Swagger/OpenAPI documentation
✅ Docker multi-stage builds + deployment guides for AWS EC2, Render, Railway, DigitalOcean

**What I learned:** Spring Security filter chains, stateless JWT design, JPA Specifications, DTO patterns, testing with security context, and production hardening.

#SpringBoot #Java #React #JWT #MySQL #Docker #FullStack #CampusJob #BackendDevelopment

---

## 🐙 GitHub Description

**🎓 Campus Job** — A production-grade, role-based campus placement platform.

**Stack:** Spring Boot 3 · Spring Security 6 · JWT · JPA/Hibernate · MySQL · React 18 · Vite · Docker · Nginx

**Capabilities:**
- 🔐 JWT authentication + RBAC (Student / Recruiter / Admin)
- 🔎 Dynamic multi-filter job search (title, location, salary, skills, type) with server-side pagination & safe sorting
- 📝 Online applications with duplicate-prevention & ownership-safe withdrawal
- 👤 Student profiles + validated resume upload
- 🧪 118 JUnit/Mockito automated tests
- 📖 Full Swagger/OpenAPI docs
- 🐳 Docker Compose (MySQL + backend + frontend) with health checks
- 🚀 Deployment guides: AWS EC2, Render, Railway, DigitalOcean, Docker

**Quick start:** `mvn spring-boot:run` · `npm run dev` · `docker compose up -d`

---

## 🗣️ Interview Explanation — (5 Minutes)

### Opening (30 seconds)
"I built **Campus Job** — a role-based web platform that digitizes the campus placement workflow. It connects three user types: **students** who search and apply for jobs, **recruiters** who post and manage jobs, and **admins** who manage users, companies, and analytics. The stack is Spring Boot 3 with Spring Security 6 and JWT on the backend, React on the frontend, MySQL for persistence, and Docker for deployment."

### Architecture & Design Decisions (1 minute)
"The backend follows a **layered architecture**: Controllers handle HTTP and validation, Services contain business logic, and Repositories handle data access. I used a **DTO + MapperService** layer so the API never exposes JPA entities directly — that keeps the internal model flexible and the API stable. For querying, I used **JPA Specifications** because the search screen had many optional filters — title, location, salary range, employment type, work mode, and skills. Specifications let me build type-safe predicate chains dynamically instead of concatenating JPQL strings, which is error-prone and harder to maintain."

### Security (1.5 minutes)
"Security was a major focus. Authentication is **stateless JWT**: on login, the server issues an HMAC-signed token with a configurable expiry. Passwords are hashed with **BCrypt**. Authorization is role-based — `STUDENT`, `RECRUITER`, `ADMIN` — enforced both at the URL level in `SecurityConfig` and at the method level with `@PreAuthorize`. The JWT filter validates the token on every request and populates the security context.

I also fixed an important security detail: the default Spring behavior returns **403** for unauthenticated requests, which is misleading. I added a custom **AuthenticationEntryPoint** so unauthenticated calls return **401** with a consistent JSON body. Beyond that, I implemented **ownership checks** on the application-withdrawal endpoint so a student can only withdraw their own pending applications — that prevents IDOR attacks. I also prevented **duplicate applications** server-side, and restricted the sortable columns to a whitelist to avoid exposing arbitrary entity properties through the API."

### Features & Workflow (1 minute)
"The core workflow: recruiters create jobs with attributes like salary range, deadline, employment type, and required skills. Students get a paginated, filtered job feed. When they apply, the backend validates the job is active, ensures the student hasn't already applied, and creates a PENDING application. Students can withdraw applications only in the PENDING state. Profiles support CGPA, skills, and a validated resume upload (PDF, ≤5 MB)."

### Testing (45 seconds)
"I wrote **118 automated tests** using JUnit 5 and Mockito. I have service-layer unit tests, controller integration tests with `@WebMvcTest`, and a full `@SpringBootTest` for the security configuration — verifying public endpoints, protected endpoints, CORS preflight, and the JWT filter chain. Getting these right required mocking the JWT infrastructure beans and using `@WithMockUser` so the security context was properly exercised in tests."

### Deployment & DevOps (45 seconds)
"For deployment, I containerized everything with **Docker**: a multi-stage build compiles the Spring Boot app into a slim JRE image, the React app into an nginx container, and MySQL uses a persistent named volume. Docker Compose wires it together with health checks so the frontend only starts after the backend, and the backend only after MySQL is healthy. I also created a production Spring profile with environment-based secrets, disabled Swagger, `ddl-auto=validate`, and tuned HikariCP, plus deployment guides for AWS EC2, Render, Railway, and DigitalOcean."

### Closing (30 seconds)
"The project gave me deep, hands-on experience with Spring Security internals, JWT design, JPA Specifications, writing robust tests, and production deployment — all areas that map directly to real-world backend engineering. If hired, I'd bring the same rigor around security, testing, and clean architecture to your team."

---

## 🗣️ HR Explanation — (1 Minute)

"During my training, I built **Campus Job** — a web application that helps colleges manage the placement process online. Think of it as a platform with three types of users: **students** who look for and apply to jobs, **recruiters** who post job openings, and **admins** who oversee everything.

I built it using **Java and Spring Boot** for the backend, with **React** for the frontend and **MySQL** for the database. I implemented secure **login with JWT tokens** and gave each role different permissions. The app lets students search jobs with filters like salary and location, apply online, and track their applications.

I also wrote **118 automated tests** to make sure the code works correctly, and I **containerized the app with Docker** so it can be deployed easily on cloud platforms like AWS, Render, or DigitalOcean.

The key skills I demonstrated are **Java, Spring Boot, REST APIs, security, SQL, and deploying applications** — and I learned how to build a real product from design to deployment."

---

<div align="center">

**Resume Project Description End** · Built with ❤️ by Nilay Bhamare

</div>
