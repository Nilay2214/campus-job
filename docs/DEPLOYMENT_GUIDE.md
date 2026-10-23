# Production Deployment Guide

Complete step-by-step deployment guide for **Campus Job**
across **Docker, AWS EC2, Render, Railway, and DigitalOcean**, with **HTTPS**, **secrets
management**, and **MySQL** configuration.

> 🚫 **Safe to deploy:** No business logic is changed. All deployment config is additive.

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#-pre-deployment-checklist)
2. [Application Architecture](#-application-architecture)
3. [Environment Variables & Secrets Management](#-environment-variables--secrets-management)
4. [application-prod.properties](#-application-prodproperties)
5. [HTTPS Recommendations](#-https-recommendations)
6. [Nginx Configuration & Reverse Proxy](#-nginx-configuration--reverse-proxy)
7. [MySQL Deployment](#-mysql-deployment)
8. [Docker Deployment](#-docker-deployment)
9. [AWS EC2 Deployment](#-aws-ec2-deployment)
10. [Render Deployment](#-render-deployment)
11. [Railway Deployment](#-railway-deployment)
12. [DigitalOcean Deployment](#-digitalocean-deployment)
13. [Post-Deployment Checks](#-post-deployment-checks)
14. [Troubleshooting](#-troubleshooting)

---

## ✅ Pre-Deployment Checklist

- [ ] MySQL 8.0 database created and reachable.
- [ ] `application-prod.properties` profile is active (`SPRING_PROFILES_ACTIVE=prod`).
- [ ] Strong `JWT_SECRET` generated (≥ 48 chars).
- [ ] Strong `DB_PASSWORD` set.
- [ ] `MAIL_USERNAME` / `MAIL_PASSWORD` configured (or SMTP disabled).
- [ ] `VITE_API_BASE_URL` points to the production API origin.
- [ ] CORS updated in `SecurityConfig` to allow the production frontend origin.
- [ ] Domain name pointed to your server/host.
- [ ] HTTPS certificate issued (Let's Encrypt) or platform-managed.
- [ ] Backend tests pass (`mvn test` → **BUILD SUCCESS**).
- [ ] Frontend builds (`npm run build` → succeeds).

---

## 🏗️ Application Architecture

```
                         ┌─────────────────────────────┐
  User (Browser) ──────▶ │  Nginx (HTTPS + proxy)      │
                         │  • Serves React static       │
                         │  • /api → backend:8080       │
                         └──────────────┬──────────────┘
                                        │ /api
                                 ┌──────▼──────┐
                                 │ Spring Boot │  (port 8080)
                                 │  (prod)     │
                                 └──────┬──────┘
                                        │ JPA
                                 ┌──────▼──────┐
                                 │   MySQL 8   │  (port 3306)
                                 └─────────────┘
```

- **Frontend** (React) is built to static files and served by Nginx.
- **Backend** (Spring Boot) runs as a Java service/container.
- **MySQL** is the persistence layer (managed or self-hosted).
- Nginx reverse-proxies `/api/*` to the backend, handling JWT headers transparently.

---

## 🌐 Environment Variables & Secrets Management

### Critical Secrets (never commit to git)
| Variable | Purpose | Example |
|----------|---------|---------|
| `JWT_SECRET` | Signs/verifies JWTs | `openssl rand -base64 48` |
| `DB_PASSWORD` | MySQL app password | `s3cr3t!Pa55` |
| `MYSQL_ROOT_PASSWORD` | MySQL root password | `r00t!Str0ng` |
| `MAIL_PASSWORD` | SMTP app password | `xxxx xxxx xxxx xxxx` |

### Generate a Strong JWT Secret
```bash
# Linux/macOS
openssl rand -base64 48

# Linux/macOS (Python)
python3 -c "import secrets; print(secrets.token_urlsafe(48))"

# Windows (PowerShell)
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Secrets Management Options

**Option A — Environment Variables (recommended for PaaS)**
Set them in the platform dashboard (Render, Railway, DO App Platform) or in `.env`.

**Option B — Docker Secrets (self-hosted)**
```bash
echo "my-super-secret" | docker secret create jwt_secret -
echo "my-db-password" | docker secret create db_password -
```
Then reference in `docker-compose.prod.yml`:
```yaml
services:
  backend:
    secrets:
      - jwt_secret
      - db_password
```
```yaml
secrets:
  jwt_secret:
    external: true
  db_password:
    external: true
```

**Option C — AWS Secrets Manager / Systems Manager Parameter Store**
```bash
aws secretsmanager create-secret --name prod/JWT_SECRET --secret-string "my-jwt-secret"
aws secretsmanager get-secret-value --secret-id prod/JWT_SECRET --query SecretString --output text
```

**Option D — Vault / HashiCorp** (enterprise)
Inject secrets into the runtime via env vars or a sidecar.

### `.env.production` template
The file `.env.production.example` is provided. Copy it securely:
```bash
cp .env.production.example .env.production
chmod 600 .env.production   # restrict permissions
# NEVER commit .env.production
```

---

## ⚙️ application-prod.properties

Created at `backend/src/main/resources/application-prod.properties`.

**Activation:** `SPRING_PROFILES_ACTIVE=prod`

```bash
# Run locally with prod profile
cd backend
SPRING_PROFILES_ACTIVE=prod mvn spring-boot:run
```

### Key production settings (vs. dev)
| Setting | Dev (`application.properties`) | Prod (`application-prod.properties`) |
|---------|-------------------------------|--------------------------------------|
| `ddl-auto` | `update` | `validate` |
| `show-sql` | `true` | `false` |
| DB SSL | `useSSL=false` | `useSSL=true&requireSSL=true` |
| Swagger UI | enabled | `false` (default) |
| Actuator | — | `health,info` only |
| Error details | shown | hidden (`never`) |
| Hikari pool | default | tuned (20 max / 5 min) |
| Logging | SQL DEBUG/TRACE | INFO/WARN, SQL OFF |

> **Note:** `ddl-auto=validate` requires the schema to already exist. Create it via
> MySQL init script or a migration tool (Flyway/Liquibase) before first deploy.

---

## 🔒 HTTPS Recommendations

### 1. Let's Encrypt + Certbot (self-hosted / VM)
```bash
# Install certbot
sudo apt update && sudo apt install -y certbot python3-certbot-nginx

# Issue cert (auto-configures nginx)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 2. Platform-managed HTTPS (Render / Railway / DigitalOcean)
- **Render:** Enable HTTPS automatically when you add a custom domain.
- **Railway:** Free TLS via `*.up.railway.app` or custom domains.
- **DigitalOcean App Platform:** Managed Let's Encrypt certificates.

### 3. TLS Hardening (in `nginx.prod.conf`)
- TLSv1.2 + TLSv1.3 only.
- Strong ciphers.
- HSTS header (`max-age=31536000; includeSubDomains`).
- HSTS preload (optional, after confirming all subdomains are HTTPS).

### 4. Force HTTPS Redirection
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}
```

---

## 🐳 Nginx Configuration & Reverse Proxy

Two nginx configs are provided:

| File | Purpose |
|------|---------|
| `frontend/nginx.conf` | Dev/HTTP reverse proxy (used by `docker-compose.yml`) |
| `frontend/nginx.prod.conf` | Production HTTPS + reverse proxy (used by `Dockerfile.prod`) |

### Reverse Proxy Rules
- `/` → SPA static files (with `try_files ... /index.html` fallback).
- `/assets/` → immutable caching (1 year).
- `/api/` → `http://backend:8080` (proxies `Authorization`, `Host`, `X-Forwarded-*`).
- Ports `80` (HTTP→HTTPS redirect) and `443` (HTTPS).

### Health route
`GET /healthz` → returns `200 ok` (used by container healthchecks).

---

## 🗄️ MySQL Deployment

### Option A — Docker MySQL (self-hosted)
Part of `docker-compose.prod.yml`:
```yaml
mysql:
  image: mysql:8.0
  environment:
    MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    MYSQL_DATABASE: ${DB_NAME}
    MYSQL_USER: ${DB_USERNAME}
    MYSQL_PASSWORD: ${DB_PASSWORD}
  volumes:
    - placement-mysql-data:/var/lib/mysql
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
```

### Option B — Amazon RDS (AWS)
1. Create a MySQL 8.0 RDS instance (min `db.t3.micro`).
2. Note the endpoint, port, username, password.
3. Enable **public access** OR run backend in the same VPC.
4. Update env vars:
   ```
   DB_HOST=<rds-endpoint>
   DB_PORT=3306
   DB_NAME=placement_db
   DB_USERNAME=<rds-user>
   DB_PASSWORD=<rds-password>
   ```

### Option C — Render MySQL
1. Create a **Render Database** (MySQL).
2. Copy the internal connection string.
3. Set `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` in the backend service.

### Option D — DigitalOcean Managed Database
1. Create a **Managed MySQL** database.
2. Whitelist your app's IP (or enable private networking).
3. Use the provided connection string.

### Initialize the Schema
```sql
-- Create database (if not already in init script)
CREATE DATABASE IF NOT EXISTS placement_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

With `ddl-auto=validate`, tables must exist. Options:
- Run the app once with `ddl-auto=update` against the prod DB **during initial setup**, then switch to `validate`.
- Use Flyway/Liquibase migrations (recommended for production).

---

## 🐳 Docker Deployment

### Files
- `docker-compose.prod.yml` — production stack (MySQL + backend + frontend).
- `Dockerfile.prod` (frontend) — builds React + serves via nginx HTTPS.
- `backend/Dockerfile` — multi-stage Spring Boot build.
- `nginx.prod.conf` — production HTTPS reverse proxy.

### Deploy
```bash
# 1. Set up environment
cp .env.production.example .env.production
# 2. Edit .env.production with real secrets

# 3. Build & start production stack
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 4. Verify
docker compose -f docker-compose.prod.yml ps
curl -I https://yourdomain.com
curl -s https://yourdomain.com/healthz
```

### Without HTTPS initially (HTTP only)
If you haven't got certs yet, temporarily use the dev nginx config:
```bash
docker compose up -d --build   # uses docker-compose.yml + nginx.conf (HTTP)
```

### Common Docker Commands
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml down -v   # destroys data volume
```

---

## ☁️ AWS EC2 Deployment

### Prerequisites
- AWS account + EC2 instance (Ubuntu 22.04, `t2.micro` or larger).
- Security Group inbound rules: **80**, **443**, **22** (SSH).
- Domain name + Route 53 (or DNS provider).

### Step 1 — Connect & Install Docker
```bash
ssh -i your-key.pem ubuntu@<ec2-public-ip>

sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# Re-login or use sudo docker
```

### Step 2 — Clone the Repo
```bash
git clone https://github.com/your-username/placement-management.git
cd placement-management
```

### Step 3 — Configure Secrets
```bash
cp .env.production.example .env.production
nano .env.production   # set real secrets
```

### Step 4 — Run with Docker Compose
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Step 5 — HTTPS with Let's Encrypt
```bash
# Install certbot
sudo apt install -y certbot

# Manual cert issuance (if nginx is in Docker)
sudo certbot certonly --standalone -d yourdomain.com --email you@example.com -agreement

# Copy certs to the cert directory
sudo mkdir -p ~/placement-management/certs
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem certs/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem certs/

# Restart frontend to pick up certs
docker compose -f docker-compose.prod.yml restart frontend
```

### Step 6 — Point DNS
Add an **A record** for `yourdomain.com` → `<ec2-public-ip>`.

### Step 7 — Optional: AWS RDS for MySQL
Follow the RDS section above and set `DB_HOST` to the RDS endpoint.

---

## 🚀 Render Deployment

Render supports both a **Web Service** (backend) and **static site** (frontend), or a single
service with nginx.

### Option A — Backend as Web Service
1. Create a **New Web Service** → connect your GitHub repo.
2. **Root Directory:** `backend`
3. **Build Command:** `mvn clean install -DskipTests`
4. **Start Command:** `java -jar target/placement-management-1.0.0.jar`
5. **Environment Variables:**
   ```
   SPRING_PROFILES_ACTIVE=prod
   DB_HOST=<render-db-host>
   DB_PORT=3306
   DB_NAME=placement_db
   DB_USERNAME=<render-db-user>
   DB_PASSWORD=<render-db-password>
   JWT_SECRET=<strong-secret>
   MAIL_USERNAME=...
   MAIL_PASSWORD=...
   ```

### Option B — Frontend as Static Site
1. Create a **New Static Site** → connect repo.
2. **Root Directory:** `frontend`
3. **Build Command:** `npm install && npm run build`
4. **Publish Directory:** `dist`
5. **Environment Variables:**
   ```
   VITE_API_BASE_URL=https://<backend-url>.onrender.com
   ```
6. **Redirect:** In the static site settings, add a **Redirect/Proxy** rule:
   - **Source:** `/api/*`
   - **Destination:** `https://<backend-url>.onrender.com/api/*`
   - **Action:** Proxy

### Option C — Render Blueprint (render.yaml)
Create `render.yaml` at repo root:
```yaml
services:
  - type: web
    name: placement-backend
    runtime: docker
    plan: free
    dockerfilePath: backend/Dockerfile
    envVars:
      - key: SPRING_PROFILES_ACTIVE
        value: prod
      - key: DB_HOST
        value: placement-db
      - key: DB_PORT
        value: 3306
      - key: DB_NAME
        value: placement_db
      - key: DB_USERNAME
        value: placement_app
      - key: DB_PASSWORD
        sync: false    # set in dashboard
      - key: JWT_SECRET
        sync: false
  - type: web
    name: placement-frontend
    runtime: docker
    plan: free
    dockerfilePath: frontend/Dockerfile.prod
    envVars:
      - key: VITE_API_BASE_URL
        value: https://placement-backend.onrender.com
databases:
  - name: placement-db
    plan: free
    databaseName: placement_db
    user: placement_app
```

---

## 🚆 Railway Deployment

Railway uses Nixpacks by default but supports Dockerfiles.

### Backend on Railway
1. **New Project** → **Deploy from GitHub**.
2. Select the repo.
3. Railway auto-detects the `backend/Dockerfile` (set root to `backend`).
4. Add a **MySQL** plugin → copy the connection string.
5. Set environment variables:
   ```
   SPRING_PROFILES_ACTIVE=prod
   JWT_SECRET=<strong-secret>
   DB_HOST=<mysql.internal>
   DB_PORT=3306
   DB_NAME=railway
   DB_USERNAME=<railway-user>
   DB_PASSWORD=<railway-password>
   ```
6. Railway provides a public URL like `https://placement-backend.up.railway.app`.

### Frontend on Railway
1. Add a second service → root `frontend`, Dockerfile `Dockerfile.prod`.
2. Set `VITE_API_BASE_URL=https://placement-backend.up.railway.app`.
3. Railway generates a URL for the frontend.

### Railway + Static Frontend
If serving the frontend as static files, set the nginx proxy target to the backend service
name. Railway's internal networking uses `backend.<service>.railway.internal`.

---

## 🐬 DigitalOcean Deployment

### Option A — DigitalOcean Droplet (Docker)
Same as AWS EC2:
1. Create a Droplet (Ubuntu 22.04).
2. Install Docker.
3. Clone repo, `docker compose -f docker-compose.prod.yml up -d --build`.
4. Point DNS A records.
5. Use Certbot / Let's Encrypt for HTTPS.

### Option B — DigitalOcean App Platform (PaaS)
1. **Create App** → connect GitHub repo.
2. Add a **Web Service** for the backend:
   - Root: `backend`
   - Dockerfile: `Dockerfile`
   - Env vars: `SPRING_PROFILES_ACTIVE=prod`, `JWT_SECRET`, DB settings.
3. Add a **Static Site** for the frontend:
   - Root: `frontend`
   - Build: `npm install && npm run build`
   - Output: `dist`
   - Env: `VITE_API_BASE_URL=https://<backend-app>.ondigitalocean.app`
4. Add a **Managed Database** (MySQL) → copy connection string.
5. App Platform auto-provisions **HTTPS** and custom domains.

### DigitalOcean + Managed MySQL
1. Create a **Managed Database** (MySQL 8).
2. In the app's environment, set `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`.
3. Enable private networking if the app is in the same region/VPC.

---

## ✅ Post-Deployment Checks

### Health Endpoints
| Check | URL |
|-------|-----|
| Frontend | `https://yourdomain.com` |
| Backend health | `https://yourdomain.com/actuator/health` |
| Nginx health | `https://yourdomain.com/healthz` |
| API (sample) | `curl -X POST https://yourdomain.com/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"secret123"}'` |

### Verify HTTPS
```bash
curl -I https://yourdomain.com
# Expect: HTTP/2 200
# Expect: Strict-Transport-Security header present
```

### Verify JWT Flow
```bash
# 1. Register
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"secret123","role":"STUDENT"}'

# 2. Login (capture token)
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"secret123"}'

# 3. Access protected endpoint
curl https://yourdomain.com/api/students/jobs \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🔧 Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `401 Unauthorized` | JWT missing/expired | Re-login; check `JWT_SECRET` consistent |
| `403 Forbidden` | Wrong role / not permitted | Check `@PreAuthorize` roles; use correct account |
| `502 Bad Gateway` | Backend unreachable | Verify backend container running & healthy; check nginx proxy target |
| `503 Service Unavailable` | Backend not ready | Check MySQL connectivity; wait for healthcheck |
| App can't connect to DB | Bad `DB_HOST`/credentials | Verify env vars; confirm MySQL reachable |
| `SSL connection error` | DB SSL mismatch | Set `useSSL=true` only if cert is trusted; or use `useSSL=false` on trusted network |
| CORS errors | Frontend origin not allowed | Update `SecurityConfig.corsConfigurationSource` allowed origins |
| Swagger 404 | Swagger disabled | Set `SWAGGER_ENABLED=true` (dev only) |
| `ddl-auto=validate` error | Schema mismatch | Run migrations or set `ddl-auto=update` once during setup |

---

<div align="center">

**Deployment Guide End** · See [DOCKER.md](DOCKER.md) for Docker-specific details.

</div>
