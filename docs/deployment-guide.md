# Deployment Guide

## Local Development
1. Start MySQL and create database `placement_db`.
2. Update credentials in backend/src/main/resources/application.properties.
3. Run backend with `mvn spring-boot:run`.
4. Run frontend with `npm install` and `npm run dev`.

## Docker (Optional)
Use Docker Compose to run MySQL and the backend.
