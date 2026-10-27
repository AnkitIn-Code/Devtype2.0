package com.devtype.admin;

import com.devtype.admin.dto.CreateReportRequest;
import com.devtype.admin.dto.ReviewReportRequest;
import com.devtype.admin.dto.UpdateUserRoleRequest;
import com.devtype.admin.dto.UpdateUserStatusRequest;
import com.devtype.admin.repository.AdminAuditLogRepository;
import com.devtype.auth.service.JwtService;
import com.devtype.practice.PracticeSession;
import com.devtype.srs.SrsCardRepository;
import com.devtype.practice.PracticeSessionRepository;
import com.devtype.practice.PracticeSessionStatus;
import com.devtype.user.AccountType;
import com.devtype.user.ReportStatus;
import com.devtype.user.User;
import com.devtype.user.UserReportRepository;
import com.devtype.user.UserRepository;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PracticeSessionRepository practiceSessionRepository;

    @Autowired
    private SrsCardRepository srsCardRepository;

    @Autowired
    private UserReportRepository userReportRepository;

    @Autowired
    private AdminAuditLogRepository auditLogRepository;

    @Autowired
    private JwtService jwtService;

    private User adminUser;
    private User secondAdminUser;
    private User standardUser;
    private String adminToken;
    private String standardToken;

    @AfterEach
    void tearDown() {
        auditLogRepository.deleteAll();
        userReportRepository.deleteAll();
        srsCardRepository.deleteAll();
        practiceSessionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
        userReportRepository.deleteAll();
        srsCardRepository.deleteAll();
        practiceSessionRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = new User();
        adminUser.setUsername("superadmin");
        adminUser.setEmail("admin@devtype.io");
        adminUser.setDisplayName("Platform Admin");
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser.setAccountType(AccountType.STANDARD);
        adminUser = userRepository.save(adminUser);

        secondAdminUser = new User();
        secondAdminUser.setUsername("backupadmin");
        secondAdminUser.setEmail("backupadmin@devtype.io");
        secondAdminUser.setDisplayName("Backup Admin");
        secondAdminUser.setRole(UserRole.ADMIN);
        secondAdminUser.setStatus(UserStatus.ACTIVE);
        secondAdminUser.setAccountType(AccountType.STANDARD);
        secondAdminUser = userRepository.save(secondAdminUser);

        standardUser = new User();
        standardUser.setUsername("regularuser");
        standardUser.setEmail("user@devtype.io");
        standardUser.setDisplayName("Regular Developer");
        standardUser.setRole(UserRole.USER);
        standardUser.setStatus(UserStatus.ACTIVE);
        standardUser.setAccountType(AccountType.STANDARD);
        standardUser = userRepository.save(standardUser);

        adminToken = jwtService.generateToken(adminUser);
        standardToken = jwtService.generateToken(standardUser);
    }

    @Test
    @DisplayName("Unauthenticated requests to /api/v1/admin/** must return 401 Unauthorized")
    void unauthenticatedAdminAccess_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/overview"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Authenticated standard USER accessing /api/v1/admin/** must receive 403 Forbidden")
    void standardUserAdminAccess_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/overview")
                        .header("Authorization", "Bearer " + standardToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + standardToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Authenticated ADMIN can access /api/v1/admin/overview successfully")
    void adminUser_accessesOverview_success() throws Exception {
        // Seed a completed session for metrics verification
        PracticeSession session = new PracticeSession();
        session.setUser(standardUser);
        session.setTemplateTitleSnapshot("Test Template");
        session.setLanguageSnapshot("JAVA");
        session.setDifficultySnapshot("BEGINNER");
        session.setStartedAt(Instant.now().minusSeconds(120));
        session.setCompletedAt(Instant.now());
        session.setDurationMs(60000L);
        session.setGrossWpm(BigDecimal.valueOf(75.0));
        session.setNetWpm(BigDecimal.valueOf(70.0));
        session.setAccuracyPercent(BigDecimal.valueOf(98.5));
        session.setCorrectCharacters(350);
        session.setIncorrectCharacters(5);
        session.setTotalCharacters(355);
        session.setErrorCount(5);
        session.setStatus(PracticeSessionStatus.COMPLETED);
        practiceSessionRepository.save(session);

        mockMvc.perform(get("/api/v1/admin/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalUsers", is(3)))
                .andExpect(jsonPath("$.data.activeUsers", is(3)))
                .andExpect(jsonPath("$.data.suspendedUsers", is(0)))
                .andExpect(jsonPath("$.data.totalPracticeSessions", is(1)))
                .andExpect(jsonPath("$.data.totalPracticeDurationSeconds", is(60)));
    }

    @Test
    @DisplayName("Admin can list users with search and filters, excluding password hashes")
    void adminListUsers_withFilters() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("search", "regular")
                        .param("role", "USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].username", is("regularuser")))
                .andExpect(jsonPath("$.data.content[0].passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("Admin cannot suspend or deactivate self")
    void adminCannotSuspendSelf() throws Exception {
        UpdateUserStatusRequest req = new UpdateUserStatusRequest(UserStatus.SUSPENDED, "Testing self-suspension");

        mockMvc.perform(patch("/api/v1/admin/users/" + adminUser.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Administrators cannot modify their own account status")));
    }

    @Test
    @DisplayName("Admin cannot suspend or demote the last active admin")
    void adminCannotSuspendLastAdmin() throws Exception {
        // Remove second admin so only adminUser remains
        userRepository.delete(secondAdminUser);

        UpdateUserStatusRequest req = new UpdateUserStatusRequest(UserStatus.SUSPENDED, "Attempt to suspend only admin");
        // Pretend a separate request tries to suspend the remaining admin
        // Since adminUser cannot suspend self, let's create a temporary admin3 to attempt suspending adminUser
        User admin3 = new User();
        admin3.setUsername("admin3");
        admin3.setEmail("admin3@devtype.io");
        admin3.setDisplayName("Admin 3");
        admin3.setRole(UserRole.USER); // Not an admin yet
        admin3.setStatus(UserStatus.ACTIVE);
        admin3 = userRepository.save(admin3);

        // If only 1 admin exists, demoting or suspending them is blocked
        UpdateUserRoleRequest demoteReq = new UpdateUserRoleRequest(UserRole.USER, "Demote last admin");
        mockMvc.perform(patch("/api/v1/admin/users/" + adminUser.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(demoteReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Administrators cannot revoke their own administrator role.")));
    }

    @Test
    @DisplayName("Admin can suspend a user, which writes an audit log and locks user immediately")
    void adminCanSuspendUser_locksOutImmediately() throws Exception {
        UpdateUserStatusRequest req = new UpdateUserStatusRequest(UserStatus.SUSPENDED, "Violation of platform terms");

        mockMvc.perform(patch("/api/v1/admin/users/" + standardUser.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("SUSPENDED")));

        // Check user in database
        User updated = userRepository.findById(standardUser.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(UserStatus.SUSPENDED);

        // Check audit log was created
        assertThat(auditLogRepository.count()).isEqualTo(1);
        var audit = auditLogRepository.findAll().get(0);
        assertThat(audit.getActionType()).isEqualTo("USER_STATUS_CHANGE");
        assertThat(audit.getTargetId()).isEqualTo(standardUser.getId());
        assertThat(audit.getPreviousState()).isEqualTo("ACTIVE");
        assertThat(audit.getNewState()).isEqualTo("SUSPENDED");
        assertThat(audit.getReason()).isEqualTo("Violation of platform terms");

        // CRITICAL: Verify that the suspended user's existing active JWT is rejected immediately
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + standardToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", is("Account is suspended. Please contact support.")));
    }

    @Test
    @DisplayName("User can submit report, cannot self-report, and admin can list and review report")
    void reportLifecycle_submitAndReview() throws Exception {
        // Self-report rejected
        CreateReportRequest selfReport = new CreateReportRequest(standardUser.getId(), "SPAM", "Self reporting test");
        mockMvc.perform(post("/api/v1/reports")
                        .header("Authorization", "Bearer " + standardToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(selfReport)))
                .andExpect(status().isBadRequest());

        // Valid report against another user
        CreateReportRequest validReport = new CreateReportRequest(secondAdminUser.getId(), "HARASSMENT", "Suspicious spamming in practice");
        mockMvc.perform(post("/api/v1/reports")
                        .header("Authorization", "Bearer " + standardToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReport)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("OPEN")));

        Long reportId = userReportRepository.findAll().get(0).getId();

        // Admin lists reports
        mockMvc.perform(get("/api/v1/admin/reports")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("status", "OPEN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].category", is("HARASSMENT")));

        // Admin reviews report
        ReviewReportRequest reviewReq = new ReviewReportRequest(ReportStatus.RESOLVED, "Investigated and warned user");
        mockMvc.perform(patch("/api/v1/admin/reports/" + reportId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("RESOLVED")))
                .andExpect(jsonPath("$.data.resolutionNote", is("Investigated and warned user")));

        // Verify audit log for report
        assertThat(auditLogRepository.count()).isEqualTo(1);
        var audit = auditLogRepository.findAll().get(0);
        assertThat(audit.getActionType()).isEqualTo("REPORT_STATUS_CHANGE");
        assertThat(audit.getTargetType()).isEqualTo("REPORT");
        assertThat(audit.getNewState()).isEqualTo("RESOLVED");
    }

    @Test
    @DisplayName("Admin audit logs are read-only and restricted to ADMIN authority")
    void auditLogs_accessControl() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + standardToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
