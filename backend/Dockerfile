# ============================================================
# STAGE 1: Build Spring Boot application using Maven
# ============================================================
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy Maven configuration
COPY pom.xml .

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy Java source code
COPY src ./src

# Build executable Spring Boot JAR
RUN mvn clean package -DskipTests -B


# ============================================================
# STAGE 2: Production runtime
# ============================================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create a non-root user
RUN addgroup -S spring \
    && adduser -S spring -G spring

# Copy the executable JAR
COPY --from=build /app/target/placement-management-1.0.0.jar app.jar

# Run as a non-root user
USER spring:spring

# Default Render web service port
EXPOSE 10000

# Health check using Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT:-10000}/actuator/health" >/dev/null || exit 1

# Start Spring Boot on Render's assigned port
ENTRYPOINT ["sh", "-c", "exec java -Dserver.port=${PORT:-10000} -Dserver.address=0.0.0.0 -jar app.jar"]