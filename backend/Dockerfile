# ==============================================================================
# DevType Backend - Multi-stage Production Containerfile
# Java 21, Spring Boot 3.3.x, Hardened Minimal JRE Runtime
# ==============================================================================

# --- Stage 1: Build & Package ---
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and POM first for efficient layer caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy application source code and compile production JAR
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# --- Stage 2: Hardened Runtime ---
FROM eclipse-temurin:21-jre-alpine AS runtime

# Install curl for container health checks
RUN apk add --no-cache curl && \
    addgroup -S devtype && adduser -S devtype -G devtype

WORKDIR /app

# Copy executable jar from builder stage
COPY --from=builder /app/target/devtype-backend-*.jar app.jar
RUN chown -R devtype:devtype /app

# Run as non-privileged system user
USER devtype

# Application port
EXPOSE 8080

# Production JVM optimizations: G1GC, container-aware memory allocation, fail-fast on OOM
ENV JAVA_OPTS="-XX:+UseG1GC -XX:+ExitOnOutOfMemoryError -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Built-in container health probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
