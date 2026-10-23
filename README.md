<div align="center">

# 🎓 Campus Job

**A full-stack, production-grade campus job & placement platform connecting students, recruiters, and administrators.**

![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-148%20Passing-22c55e)
![License](https://img.shields.io/badge/License-MIT-3b82f6)

**A Role-Based Access Controlled (RBAC) campus recruitment platform** built with a
**React.js frontend** and a **Spring Boot backend**, featuring JWT authentication,
job search & filtering, online applications, recruiter dashboards, and admin analytics.

</div>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [API Images](#-api-images)
- [JWT Authentication](#-jwt-authentication)
- [Database](#-database)
- [Installation](#-installation)
- [Run Locally](#-run-locally)
- [Docker Setup](#-docker-setup)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Future Scope](#-future-scope)
- [Contributors](#-contributors)
- [License](#-license)

---

## 🚀 Project Overview

The **Campus Job** platform is an enterprise-level web application that
streamlines the entire campus placement and recruitment workflow. It provides three distinct role-based
portals:

- 👨‍🎓 **Students** — browse active job openings, apply with one click, manage their profile
  (including PDF resume upload/deletion), and track application status.
- 🏢 **Recruiters** — post and manage jobs, view candidate applications, download applicant resumes, and manage company
  profiles.
- 🛡️ **Admins** — manage users (with lockout prevention), oversee companies, view analytics, and monitor audit
  activity.

The backend is built with a **layered architecture** (Controller → Service → Repository),
enforces **role-based access control** via Spring Security, and exposes a fully documented
**OpenAPI/Swagger** API.

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication (stateless, secure).
- Role-based access control (`ADMIN`, `STUDENT`, `RECRUITER`).
- Centralized error handling with an unauthenticated `401` entry point.

### 🎯 Job Management
- Advanced job search with keyword (title) and location filters.
- Filter by salary range, employment type, work mode, experience, and required skills.
- Server-side **pagination** and **sorting** (whitelisted columns prevents injection).
- Active job listing + full job detail view.

### 📝 Student Features
- Create and update a detailed student profile.
- Resume upload (validated: PDF, ≤ 5 MB).
- Apply to jobs with duplicate-application prevention.
- View and withdraw pending applications.

### 🏢 Recruiter Features
- Create and manage job postings.
- Recruiter-scoped job listing with pagination & filtering.
- View and manage candidate applications.

### 🛡️ Admin Features
- Dashboard, user management, company management, analytics, and audit logs.

### 🧪 Testing & Quality
- **118 automated tests** (JUnit 5 + Mockito) covering controllers, services, security, and repository queries.
- Full **Swagger/OpenAPI** documentation for every endpoint.

---

## 🏗️ Architecture

The application follows a clean **layered architecture** with a clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React)                            │
│   Student Portal • Recruiter Portal • Admin Portal                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │  HTTPS / JWT (Authorization: Bearer)
┌───────────────────────────────▼─────────────────────────────────────┐
│                   SPRING BOOT (Backend)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │ Controllers │→ │  Services   │→ │ Repositories (Spring Data)  │  │
│  │  (REST API) │  │ (Business)  │  │  JPA / Hibernate            │  │
│  └─────────────┘  └─────────────┘  └──────────────┬──────────────┘  │
│        │                     │                    │                  │
│  ┌─────▼─────┐   ┌───────────▼───────────┐   ┌────▼─────────────┐   │
│  │  DTOs     │   │  Spring Security      │   │ MySQL Database   │   │
│  │ + Mapper  │   │  JWT Filter + RBAC    │   │  (MySQL 8.0)     │   │
│  └───────────┘   └───────────────────────┘   └──────────────────┘   │
│  • Global Exception Handler  • Swagger / OpenAPI                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions
- **Controller–Service–Repository** pattern for clean separation of concerns.
- **DTOs + MapperService** to avoid exposing JPA entities directly.
- **JWT stateless sessions** — no server-side session storage.
- **Method-level security** (`@PreAuthorize`) for granular role enforcement.
- **Specifications (JPA)** for dynamic, type-safe query building.
- **Docker Compose** with MySQL, backend, and frontend services.

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Java 17** | Core language |
| **Spring Boot 3.2.5** | Application framework |
| **Spring Security 6** | Authentication & authorization |
| **Spring Data JPA / Hibernate** | ORM & persistence |
| **JWT (jjwt 0.12.5)** | Stateless token auth |
| **springdoc-openapi** | Swagger/OpenAPI documentation |
| **MySQL 8** | Relational database |
| **Maven** | Build & dependency management |
| **JUnit 5 + Mockito** | Unit & integration testing |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **Vite 5** | Build tool & dev server |
| **React Router 6** | Client-side routing |
| **Axios** | HTTP client |
| **React Toastify** | Notifications |
| **Tailwind CSS** | Styling |

### DevOps
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-service orchestration |
| **Nginx** | Reverse proxy & static serving |

---

## 📁 Folder Structure

```
campus-job/
├── backend/                          # Spring Boot application
│   ├── src/main/java/com/placement/
│   │   ├── config/                   # Security, JWT, OpenAPI config
│   │   ├── controller/               # REST controllers (8)
│   │   ├── dto/                      # Data transfer objects
│   │   ├── entity/                   # JPA entities (User, Job, Company, etc.)
│   │   ├── exception/                # Global exception handling
│   │   ├── repository/               # Spring Data repositories
│   │   ├── service/                  # Business logic layer
│   │   └── specification/            # JPA specifications (dynamic queries)
│   ├── src/test/java/com/placement/  # 118 unit & integration tests
│   ├── src/main/resources/           # application.properties
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                         # React application
│   ├── src/
│   │   ├── api/                      # Axios instance (JWT interceptor)
│   │   ├── components/               # Reusable UI components
│   │   ├── pages/                    # Page-level components
│   │   │   ├── admin/                # Admin pages
│   │   │   ├── applications/         # Student applications
│   │   │   ├── dashboard/            # Student dashboard
│   │   │   ├── jobs/                 # Job list & details
│   │   │   ├── profile/              # Student profile & resume
│   │   │   └── recruiter/            # Recruiter pages
│   │   └── services/                 # API service modules
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docs/                             # Documentation
│   ├── api-docs.md
│   ├── api-testing-guide.md
│   ├── deployment-guide.md
│   ├── DOCKER.md
│   ├── er-diagram.txt
│   └── production-readiness-audit.md
│
├── docker-compose.yml                # 3-service orchestration
├── .env.example                      # Environment variable template
└── README.md
```

---

## 🖼️ API Images

> 📸 **Add your Swagger/OpenAPI screenshots here.**

Place your API documentation screenshots in the `docs/images/` folder and reference them below:

| Swagger UI | OpenAPI JSON |
|------------|--------------|
| `![]()` | `![]()` |

---

## 🔐 JWT Authentication

The application uses **stateless JWT (JSON Web Token)** authentication.

### Flow
1. **Register / Login** → `POST /api/auth/register` or `POST /api/auth/login`.
2. Backend validates credentials and returns a signed **JWT** + user role.
3. Client stores the token in `localStorage`.
4. The Axios interceptor automatically attaches the header:
   ```
   Authorization: Bearer <your-jwt-token>
   ```
5. The `JwtAuthenticationFilter` validates the token on every protected request.
6. The `JwtUtil` verifies signature, expiry, and subject (email).

### Token Details
| Property | Value |
|----------|-------|
| Signing Algorithm | HMAC-SHA (`Keys.hmacShaKeyFor`) |
| Expiration | `86400000` ms (24h) — configurable |
| Claim Subject | User email |
| Configuration | `app.jwt.secret`, `app.jwt.expiration-ms` |

### Security Configuration
- CSRF **disabled** (stateless API).
- CORS enabled for `http://localhost:3000` and `http://localhost:5173`.
- Unauthenticated requests → **401** (custom `AuthenticationEntryPoint`).
- Role-based access via `@PreAuthorize` and URL matchers.

---

## 🗄️ Database

Schema is managed by **Hibernate** (`ddl-auto=update` by default).

### Entities
| Entity | Table | Purpose |
|--------|-------|---------|
| `User` | `users` | Login credentials + role (ADMIN/STUDENT/RECRUITER) |
| `StudentProfile` | `student_profiles` | Student details (name, CGPA, skills, resume URL) |
| `Company` | `companies` | Company information |
| `Job` | `jobs` | Job postings |
| `Application` | `applications` | Student↔Job applications |

### Relationship Diagram
```
User 1──1 StudentProfile
User 1──N Job          (recruiter)
Company 1──N Job
StudentProfile 1──N Application
Job 1──N Application
```

> See [docs/er-diagram.txt](docs/er-diagram.txt) for the full ER diagram.

---

## 💻 Installation

### Prerequisites
- **Java 17+**
- **Node.js 18+**
- **Maven 3.8+**
- **MySQL 8.0** (local) or **Docker** (containerized)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/campus-job.git
cd campus-job
```

### 2. Configure the Database
Create a MySQL database and update `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/placement_db
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
```

---

## 🚦 Run Locally

### Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
Backend runs at **http://localhost:8080**

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at **http://localhost:3000**

### Swift API during development
```properties
# frontend/.env  (or set VITE_API_BASE_URL)
VITE_API_BASE_URL=http://localhost:8080
```

---

## 🐳 Docker Setup

The project is fully containerized with a **3-service** Docker Compose stack.

### Quick Start
```bash
# 1. Create the environment file
cp .env.example .env

# 2. Edit .env and set a strong JWT_SECRET

# 3. Build and start all services
docker compose up --build -d

# 4. Verify health
docker compose ps
```

### Services
| Service | Container | Image | Port |
|---------|-----------|-------|------|
| `mysql` | `placement-mysql` | `mysql:8.0` | `3306` |
| `backend` | `placement-backend` | Custom (multi-stage) | `8080` |
| `frontend` | `placement-frontend` | Custom (Nginx) | `3000` |

### Access
| Resource | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui/index.html |
| Health | http://localhost:8080/actuator/health |

### Common Commands
```bash
docker compose down          # Stop services
docker compose down -v       # Stop + remove volumes (destroys data)
docker compose logs -f backend
docker compose restart backend
```

> 📖 Full guide: [docs/DOCKER.md](docs/DOCKER.md)

---

## 📚 API Documentation

Interactive documentation is available via **Swagger UI** (springdoc-openapi).

- **Swagger UI:** `http://localhost:8080/swagger-ui/index.html`
- **OpenAPI JSON:** `http://localhost:8080/v3/api-docs`

### Core Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Login & get JWT |
| GET | `/api/students/jobs` | STUDENT/RECRUITER/ADMIN | List & filter jobs |
| GET | `/api/students/jobs/{id}` | STUDENT/RECRUITER/ADMIN | Job details |
| GET | `/api/students/jobs/active/list` | STUDENT/RECRUITER/ADMIN | Active jobs |
| POST | `/api/students/profile` | STUDENT | Save/update profile |
| GET | `/api/students/profile` | STUDENT | Get profile |
| POST | `/api/students/profile/resume` | STUDENT | Upload resume |
| POST | `/api/applications/{jobId}` | STUDENT | Apply to job |
| GET | `/api/applications` | STUDENT | My applications |
| DELETE | `/api/applications/{applicationId}` | STUDENT | Withdraw application |
| POST | `/api/recruiters/jobs` | RECRUITER | Create job |
| GET | `/api/recruiters/jobs` | RECRUITER | List my jobs |
| GET | `/api/admin/dashboard` | ADMIN | Admin dashboard |

> 📖 Full API reference: [docs/api-docs.md](docs/api-docs.md) · [docs/api-testing-guide.md](docs/api-testing-guide.md)

---

## 📸 Screenshots

> 📸 **Add your application screenshots here.**

| Dashboard | Job Listing |
|-----------|-------------|
| `![]()` | `![]()` |

| Job Details | Admin Dashboard |
|-------------|-----------------|
| `![]()` | `![]()` |

---

## 🔮 Future Scope

- 🔄 **Email notifications** (SMTP already configured) for application status updates.
- 💾 **Persistent resume storage** (currently validated but not stored) — integrate S3/cloud storage.
- 📊 **Advanced analytics** with charts for placement trends.
- 📱 **Progressive Web App (PWA)** support for mobile access.
- 🔔 **Real-time notifications** via WebSockets.
- 🗄️ **Flyway/Liquibase** database migrations for versioned schema control.
- 🧪 **Cypress/Playwright** end-to-end testing.
- 🌐 **i18n** multi-language support.
- 🔒 **Refresh token** rotation for enhanced security.

---

## 👥 Contributors

<!-- ALL-CONTRIBUTORS-LIST:START -->
| Name | Role |
|------|------|
| **[Nilay Bhamare](https://github.com/your-username)** | Full-Stack Developer & Project Lead |

<!-- ALL-CONTRIBUTORS-LIST:END -->

Contributions are welcome! Please:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

```
MIT License

Copyright (c) 2026 Campus Job

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<div align="center">

**⭐ Star this repository if you find it useful!**

Built with ❤️ using **Spring Boot** and **React**

</div>
