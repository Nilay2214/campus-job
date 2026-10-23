# Docker Deployment Guide

This guide walks you through running **Campus Job** in production using Docker Compose.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend  │ ───► │   Backend    │ ───► │    MySQL     │
│  (React +   │  /api│  (Spring      │      │  (MySQL 8)   │
│   Nginx)    │      │   Boot)      │      │              │
│  :3000      │      │  :8080       │      │  :3306       │
└─────────────┘      └──────────────┘      └──────────────┘
```

- **Frontend** (Nginx) serves the React build and proxies `/api/*` to the backend.
- **Backend** (Spring Boot) exposes the REST API and connects to MySQL.
- **MySQL** persists all data in a Docker named volume.

All three services share an isolated Docker network `placement-network`.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.x)

## Quick Start

### 1. Create your environment file

```bash
cp .env.example .env
```

Edit `.env` and **set a strong `JWT_SECRET`** (at least 32 characters) for production.

### 2. Build and start all services

```bash
docker compose up --build -d
```

This will:
1. Build the Maven image (multi-stage) and package the Spring Boot jar.
2. Build the React app with Vite and serve it with Nginx.
3. Start MySQL 8.0 with a persistent volume.
4. Wire up the services on the shared network.

### 3. Verify everything is running

```bash
docker compose ps
```

| Service  | Container Name      | Status                                  |
|----------|---------------------|-----------------------------------------|
| `mysql`  | `placement-mysql`   | `healthy` (depends on healthcheck)      |
| `backend`| `placement-backend` | `healthy` (depends on healthcheck)      |
| `frontend`| `placement-frontend`| `healthy` (depends on healthcheck)      |

### 4. Access the application

| Resource   | URL                                            |
|------------|------------------------------------------------|
| Frontend   | http://localhost:3000                          |
| Backend    | http://localhost:8080                          |
| Swagger UI | http://localhost:8080/swagger-ui/index.html    |
| Health     | http://localhost:8080/actuator/health          |
| MySQL      | localhost:3306 (via host)                      |

## Environment Variables

All variables are defined in `.env.example` and can be overridden:

| Variable             | Description                              | Default                        |
|----------------------|------------------------------------------|--------------------------------|
| `DB_NAME`            | MySQL database name                      | `placement_db`                 |
| `DB_USERNAME`        | MySQL application user                   | `placement`                    |
| `DB_PASSWORD`        | MySQL application password               | `placementpass`                |
| `MYSQL_PORT`         | Host port for MySQL                      | `3306`                         |
| `JWT_SECRET`         | JWT signing secret (>=32 chars)          | `change-me...`                 |
| `JWT_EXPIRATION_MS`  | Token expiry (ms)                        | `86400000` (24h)               |
| `DDL_AUTO`           | Hibernate DDL mode                       | `update`                       |
| `SHOW_SQL`           | Show SQL in logs                         | `false`                        |
| `MAIL_HOST`          | SMTP host                                | `smtp.gmail.com`               |
| `MAIL_PORT`          | SMTP port                                | `587`                          |
| `MAIL_USERNAME`      | SMTP username                            | `your-email@gmail.com`         |
| `MAIL_PASSWORD`      | SMTP app password                        | `your-app-password`            |
| `VITE_API_BASE_URL`  | Backend API base URL (build-time)        | `http://localhost:8080`        |

## Volumes

- **`mysql_data`**: Named volume `placement-mysql-data` → `/var/lib/mysql`. This persists all database data across container restarts.

## Networks

- **`placement-network`**: A bridge network that isolates the three services. Only the frontend and backend expose ports to the host; MySQL is internal.

## Health Checks

Each service has a Docker `HEALTHCHECK`:

| Service  | Command                                  | Interval |
|----------|------------------------------------------|----------|
| `mysql`  | `mysqladmin ping`                        | 10s      |
| `backend`| `wget http://localhost:8080/actuator/health` | 30s  |
| `frontend`| `wget http://localhost/`                | 30s      |

The backend waits for MySQL to become healthy (`depends_on: condition: service_healthy`) before starting.

## Common Commands

```bash
# Start all services
docker compose up --build -d

# Stop all services
docker compose down

# Stop and remove volumes (destroys data!)
docker compose down -v

# View logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql

# Restart a single service
docker compose restart backend

# Run backend tests
docker compose run --rm backend mvn test

# Show container resource usage
docker stats
```

## Security Notes (Production)

- **Always set a strong `JWT_SECRET`** in `.env` — never use the default.
- Set `DDL_AUTO=validate` (or `none`) once you introduce Flyway/Liquibase migrations.
- The backend runs as a **non-root user** (`spring:spring`) inside the container.
- The database is not exposed to the host by default (it is internal to the network). Remove the `MYSQL_PORT` mapping if you don't need host access.
- Frontend is served via Nginx with gzip compression and immutable asset caching.

## Troubleshooting

**Backend fails to start / health check fails**
- Check MySQL is healthy: `docker compose ps mysql`
- Check logs: `docker compose logs backend`
- Ensure `DB_HOST=mysql` is set (service name, not `localhost`).

**Frontend can't reach the API**
- The Nginx config proxies `/api/*` to `backend:8080`. If you're testing the frontend directly against the backend, ensure `VITE_API_BASE_URL` matches.
- Verify CORS origins in `SecurityConfig` include your browser origin.

**Port already in use**
- Change the host port mappings in `docker-compose.yml` (e.g., `"3001:80"`, `"8081:8080"`).
