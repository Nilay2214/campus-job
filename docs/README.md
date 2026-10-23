# Campus Job

A production-grade full-stack campus placement and recruitment platform built with React.js and Spring Boot.

## Tech Stack
- Frontend: React.js, React Router, Axios, Vite
- Backend: Spring Boot, Spring Security, JWT, Hibernate, MySQL, Maven
- Testing: JUnit, Mockito
- DevOps: Docker-ready structure

## Architecture
- Layered architecture with Controller-Service-Repository pattern
- DTOs and entity mapping
- Global exception handling
- Validation and logging
- Role-based access control

## Modules
- Authentication and user management
- Student profile and placement workflow
- Recruiter and company job management
- Job applications and tracking
- Admin dashboard and reporting
- Placement drives and analytics

## Run Instructions
### Backend
```bash
cd backend
mvn spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker (Production)
```bash
# 1. Create environment file
cp .env.example .env

# 2. Edit .env and set a strong JWT_SECRET

# 3. Build and start all services
docker compose up --build -d

# 4. Access
# Frontend : http://localhost:3000
# Backend  : http://localhost:8080
# Swagger  : http://localhost:8080/swagger-ui/index.html
```

See [docs/DOCKER.md](DOCKER.md) for full Docker deployment instructions.

## Documentation
- 📖 **Deployment Guide:** [docs/DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) — AWS EC2, Render, Railway, DigitalOcean, Docker, HTTPS, secrets.
- 🗄️ **MySQL Deployment:** [docs/MYSQL_DEPLOYMENT.md](MYSQL_DEPLOYMENT.md)
- 🔌 **Frontend Integration:** [docs/FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)
- 🐳 **Docker Guide:** [docs/DOCKER.md](DOCKER.md)
- 📄 API Documentation: see docs/api-docs.md
- 📐 ER Diagram: see docs/er-diagram.txt
