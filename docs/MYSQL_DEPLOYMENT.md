# MySQL Production Deployment Guide

Deployment options and hardening for the **MySQL 8.0** database used by the
Campus Job platform.

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Option A — Docker MySQL (Self-Hosted)](#-option-a--docker-mysql-self-hosted)
3. [Option B — AWS RDS](#-option-b--aws-rds)
4. [Option C — DigitalOcean Managed Database](#-option-c--digitalocean-managed-database)
5. [Option D — Render / Railway Managed MySQL](#-option-d--render--railway-managed-mysql)
6. [Database Schema Setup](#-database-schema-setup)
7. [Production Hardening](#-production-hardening)
8. [Backup & Restore](#-backup--restore)
9. [Connection Configuration](#-connection-configuration)

---

## ✅ Prerequisites

- MySQL **8.0** (the app uses the MySQL 8 dialect).
- Credentials for the application user.
- Access to the database from the backend host (network path open).

---

## 🐳 Option A — Docker MySQL (Self-Hosted)

This is already included in `docker-compose.prod.yml`:

```yaml
mysql:
  image: mysql:8.0
  container_name: placement-mysql-prod
  restart: always
  networks:
    - placement-network
  volumes:
    - placement-mysql-data:/var/lib/mysql
  environment:
    MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    MYSQL_DATABASE: ${DB_NAME:-placement_db}
    MYSQL_USER: ${DB_USERNAME:-placement_app}
    MYSQL_PASSWORD: ${DB_PASSWORD}
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
    interval: 15s
    timeout: 10s
    retries: 10
    start_period: 60s
```

### Data Persistence
- The named volume `placement-mysql-data` persists data across container restarts.
- **Do NOT use `down -v`** unless you intend to delete the database.

### Connect from the host
```bash
docker exec -it placement-mysql-prod mysql -u root -p
```

---

## ☁️ Option B — AWS RDS

### Create a MySQL RDS Instance
1. Open **AWS Console → RDS → Create Database**.
2. Engine: **MySQL 8.0**.
3. Template: **Production** (or Free tier for testing).
4. DB instance size: `db.t3.micro` or larger.
5. **Storage:** Enable **Multi-AZ** for production; enable **auto-scaling**.
6. **Connectivity:** Set **Public access** to "Yes" only if the backend is outside the VPC.
   Otherwise keep it private within the VPC.
7. **VPC security group:** Allow inbound TCP `3306` from the backend's security group.

### Get the Endpoint
Copy the **Endpoint** (hostname) and **Port** from the RDS console.

### Configure the Backend
```env
DB_HOST=<your-app-db-instance.xxxxxxx.us-east-1.rds.amazonaws.com>
DB_PORT=3306
DB_NAME=placement_db
DB_USERNAME=<rds-user>
DB_PASSWORD=<rds-password>
```

### RDS Hardening
- Enable **encryption at rest** (KMS).
- Enable **automated backups** (7–35 days).
- Enable **Multi-AZ** for high availability.
- Use **IAM DB authentication** (optional, advanced).
- Enable **Performance Insights** for monitoring.

---

## 🐬 Option C — DigitalOcean Managed Database

### Create a Managed MySQL Database
1. **DigitalOcean → Databases → Create Database**.
2. Engine: **MySQL 8**.
3. Region: **same region as your app** (for private networking).
4. Plan: Basic or Production.

### Connect
- Copy the **connection string** from the dashboard.
- Whitelist your app's IP, or enable **private networking** for the droplet/app.

### Private Networking (for Droplets)
- Enable **Trusted Sources** → add your app's droplet IP.
- Or connect the app to the same **VPC** as the database.

### Configure the Backend
```env
DB_HOST=<private-db-host>
DB_PORT=25060
DB_NAME=placement_db
DB_USERNAME=<db-user>
DB_PASSWORD=<db-password>
```

---

## 🚄 Option D — Render / Railway Managed MySQL

### Render
1. Create a **Render Database** (MySQL).
2. Copy the **Internal Connection String** (preferred for services in the same region).
3. Set the backend env vars:
   ```
   DB_HOST=<render-db-host>
   DB_PORT=3306
   DB_NAME=placement_db
   DB_USERNAME=<render-db-user>
   DB_PASSWORD=<render-db-password>
   ```

### Railway
1. Use the **MySQL plugin** (Railway manages it).
2. Copy the connection string from the plugin's Data tab.
3. The internal hostname is usually `<service>.internal` (only reachable from other Railway services).
4. Set the backend env vars accordingly.

---

## 🗄️ Database Schema Setup

With `ddl-auto=validate` in production, tables must already exist.

### Create the Database
```sql
CREATE DATABASE IF NOT EXISTS placement_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### Grant privileges to the app user
```sql
CREATE USER IF NOT EXISTS 'placement_app'@'%' IDENTIFIED BY 'your-strong-password';
GRANT ALL PRIVILEGES ON placement_db.* TO 'placement_app'@'%';
FLUSH PRIVILEGES;
```

### Generate the schema (first-time setup)
The simplest way to generate the initial schema is to run the app once with
`ddl-auto=update` against the production DB, then switch to `validate`.

**Alternatively**, use Flyway/Liquibase migrations (recommended long-term).

---

## 🔒 Production Hardening

| Area | Recommendation |
|------|----------------|
| **Passwords** | Use strong, unique passwords; store in secrets manager. |
| **Network** | Keep MySQL private (no public exposure) when possible. |
| **Encryption** | Enable TLS between app and DB (`useSSL=true&requireSSL=true`). |
| **Backups** | Enable automated daily backups + point-in-time recovery. |
| **Security** | Restrict DB user to only the app database. |
| **Users** | Never use `root` for the application — use a limited user. |
| **Monitoring** | Enable query logs / slow query log in production. |
| **Resource limits** | Set memory/CPU limits in Docker to prevent OOM. |

---

## 💾 Backup & Restore

### Logical Backup (mysqldump)
```bash
# Backup
mysqldump -h <DB_HOST> -u <DB_USERNAME> -p placement_db > backup_$(date +%F).sql

# Restore
mysql -h <DB_HOST> -u <DB_USERNAME> -p placement_db < backup_2025-01-01.sql
```

### Docker MySQL Backup
```bash
docker exec placement-mysql-prod mysqldump -u root -p placement_db > backup.sql
```

### Restore into Docker MySQL
```bash
cat backup.sql | docker exec -i placement-mysql-prod mysql -u root -p placement_db
```

### AWS RDS
- Automated backups are enabled by default (retention 7–35 days).
- **Point-in-time recovery** can restore to any time within the retention window.

---

## 🔌 Connection Configuration

### application-prod.properties (production)
```properties
spring.datasource.url=jdbc:mysql://${DB_HOST}:${DB_PORT:3306}/${DB_NAME}?useSSL=true&requireSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.hikari.maximum-pool-size=${DB_POOL_MAX:20}
spring.datasource.hikari.minimum-idle=${DB_POOL_MIN:5}
```

### Readiness
- HikariCP is configured with sensible timeouts (30s connection, 10min idle).
- The backend container waits for MySQL to be healthy before starting (via `depends_on`).

---

<div align="center">

**MySQL Deployment Guide End** · See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for the full platform guide.

</div>
