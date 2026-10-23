# ============================================================
# STAGE 1: Build the Spring Boot application with Maven
# ============================================================
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml first to leverage Docker layer caching
COPY pom.xml .
# Download dependencies (cached unless pom.xml changes)
RUN mvn dependency:go-offline -B

# Copy source code and build the jar (skip tests for a faster image build)
COPY src ./src
RUN mvn clean package -DskipTests -B

# ============================================================
# STAGE 2: Runtime image (slim JRE)
# ============================================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create a non-root user to run the application (security best practice)
RUN addgroup -S spring && adduser -S spring -G spring

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Switch to the non-root user
USER spring:spring

# Expose the application port
EXPOSE 8080

# Health check (uses the sample health endpoint; requires spring-boot-starter-actuator)
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
