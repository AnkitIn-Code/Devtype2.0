package com.devtype.monitoring.service;

import com.devtype.monitoring.dto.HealthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Service providing minimal health and operational status.
 */
@Service
public class HealthService {

    private final String applicationName;
    private final String applicationVersion;

    public HealthService(
            @Value("${spring.application.name:devtype-backend}") String applicationName,
            @Value("${devtype.version:1.0.0}") String applicationVersion) {
        this.applicationName = applicationName;
        this.applicationVersion = applicationVersion;
    }

    public HealthResponse getHealthStatus() {
        return HealthResponse.builder()
                .status("UP")
                .service(applicationName)
                .version(applicationVersion)
                .timestamp(Instant.now())
                .build();
    }
}
