package com.devtype.monitoring;

import com.devtype.auth.dto.LoginRequest;
import com.devtype.auth.service.JwtService;
import com.devtype.common.filter.CorrelationIdFilter;
import com.devtype.user.AccountType;
import com.devtype.user.User;
import com.devtype.user.UserRepository;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.actuate.observability.AutoConfigureObservability;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureObservability
@ActiveProfiles("test")
class ObservabilityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private MeterRegistry meterRegistry;

    private User adminUser;
    private User standardUser;
    private String adminToken;
    private String standardToken;

    @AfterEach
    void tearDown() {
        userRepository.deleteAll();
    }

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        adminUser = new User();
        adminUser.setUsername("obs_admin");
        adminUser.setEmail("obs_admin@devtype.io");
        adminUser.setPasswordHash(passwordEncoder.encode("SecurePass123!"));
        adminUser.setDisplayName("Observability Admin");
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser.setAccountType(AccountType.STANDARD);
        adminUser = userRepository.save(adminUser);

        standardUser = new User();
        standardUser.setUsername("obs_user");
        standardUser.setEmail("obs_user@devtype.io");
        standardUser.setPasswordHash(passwordEncoder.encode("SecurePass123!"));
        standardUser.setDisplayName("Observability User");
        standardUser.setRole(UserRole.USER);
        standardUser.setStatus(UserStatus.ACTIVE);
        standardUser.setAccountType(AccountType.STANDARD);
        standardUser = userRepository.save(standardUser);

        adminToken = jwtService.generateToken(adminUser);
        standardToken = jwtService.generateToken(standardUser);
    }

    @Test
    @DisplayName("Health probes (/actuator/health, liveness, readiness, /api/v1/health) are public and UP")
    void healthProbes_arePublicAndReportUp() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")));

        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")));

        mockMvc.perform(get("/actuator/health/liveness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")));

        mockMvc.perform(get("/actuator/health/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")));
    }

    @Test
    @DisplayName("Actuator security boundaries: prometheus requires ADMIN, unexposed endpoints are blocked")
    void actuatorSecurityBoundaries() throws Exception {
        // Prometheus endpoint rejects unauthenticated access
        mockMvc.perform(get("/actuator/prometheus"))
                .andExpect(status().isUnauthorized());

        // Prometheus endpoint rejects non-admin users
        mockMvc.perform(get("/actuator/prometheus")
                        .header("Authorization", "Bearer " + standardToken))
                .andExpect(status().isForbidden());


        // Prometheus endpoint permits authorized administrators
        mockMvc.perform(get("/actuator/prometheus")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Sensitive actuator endpoints like env are not exposed
        mockMvc.perform(get("/actuator/env"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Correlation ID filter propagates valid IDs, generates safe UUIDs, and redacts malicious headers")
    void correlationId_propagationAndSanitization() throws Exception {
        // 1. Without correlation header -> generates UUID and emits X-Correlation-ID header
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(header().exists(CorrelationIdFilter.CORRELATION_ID_HEADER));

        // 2. With safe correlation header -> echoes same header back
        String clientCorrelationId = "client-trace-12345_abc";
        mockMvc.perform(get("/api/v1/health")
                        .header(CorrelationIdFilter.CORRELATION_ID_HEADER, clientCorrelationId))
                .andExpect(status().isOk())
                .andExpect(header().string(CorrelationIdFilter.CORRELATION_ID_HEADER, clientCorrelationId));

        // 3. With malicious injection attempt -> generates clean fallback UUID
        String maliciousHeader = "evil\r\nInjected-Header: true";
        var res = mockMvc.perform(get("/api/v1/health")
                        .header(CorrelationIdFilter.CORRELATION_ID_HEADER, maliciousHeader))
                .andExpect(status().isOk())
                .andReturn();

        String returnedId = res.getResponse().getHeader(CorrelationIdFilter.CORRELATION_ID_HEADER);
        assertThat(returnedId).isNotNull();
        assertThat(returnedId).isNotEqualTo(maliciousHeader);
        assertThat(returnedId).matches("^[0-9a-fA-F-]{36}$");

        // 4. On API error -> correlationId is present in response envelope
        mockMvc.perform(get("/api/v1/non-existent-endpoint")
                        .header("Authorization", "Bearer " + standardToken))
                .andExpect(status().isNotFound())
                .andExpect(header().exists(CorrelationIdFilter.CORRELATION_ID_HEADER))
                .andExpect(jsonPath("$.correlationId", notNullValue()));
    }

    @Test
    @DisplayName("Admin monitoring summary API: enforces RBAC and returns live JVM/database metrics")
    void adminMetricsSummary_accessControlAndData() throws Exception {
        // Unauthenticated access returns 401
        mockMvc.perform(get("/api/v1/admin/metrics/summary"))
                .andExpect(status().isUnauthorized());

        // Non-admin access returns 403
        mockMvc.perform(get("/api/v1/admin/metrics/summary")
                        .header("Authorization", "Bearer " + standardToken))
                .andExpect(status().isForbidden());

        // Admin access returns 200 with rich operational metrics
        mockMvc.perform(get("/api/v1/admin/metrics/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.system.status", is("UP")))
                .andExpect(jsonPath("$.data.system.databaseStatus", is("UP")))
                .andExpect(jsonPath("$.data.system.uptimeSeconds", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.data.memory.heapUsedBytes", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.data.threads.liveThreads", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.http.totalRequests", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.data.database.maxConnections", greaterThanOrEqualTo(1)));

        // Timeseries info endpoint returns active scraping configuration
        mockMvc.perform(get("/api/v1/admin/metrics/timeseries")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("SCRAPING_ACTIVE")))
                .andExpect(jsonPath("$.data.prometheusEndpoint", is("/actuator/prometheus")));
    }

    @Test
    @DisplayName("Authentication metrics record successes and failure reasons in MeterRegistry")
    void authMetrics_recording() throws Exception {
        // Failed login
        LoginRequest badReq = new LoginRequest("obs_user", "WrongPassword!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badReq)))
                .andExpect(status().isUnauthorized());

        // Successful login
        LoginRequest goodReq = new LoginRequest("obs_user", "SecurePass123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(goodReq)))
                .andExpect(status().isOk());

        // Verify counters in MeterRegistry
        double failCount = meterRegistry.find("devtype.auth.attempts")
                .tag("outcome", "failure")
                .tag("reason", "bad_credentials")
                .counter()
                .count();
        assertThat(failCount).isGreaterThanOrEqualTo(1.0);

        double successCount = meterRegistry.find("devtype.auth.attempts")
                .tag("outcome", "success")
                .counter()
                .count();
        assertThat(successCount).isGreaterThanOrEqualTo(1.0);
    }
}
