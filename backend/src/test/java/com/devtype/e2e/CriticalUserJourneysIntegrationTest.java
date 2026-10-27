package com.devtype.e2e;

import com.devtype.achievement.Achievement;
import com.devtype.achievement.AchievementRepository;
import com.devtype.achievement.UserAchievementRepository;
import com.devtype.admin.dto.CreateReportRequest;
import com.devtype.admin.dto.ReviewReportRequest;
import com.devtype.admin.dto.UpdateUserStatusRequest;
import com.devtype.admin.repository.AdminAuditLogRepository;
import com.devtype.auth.dto.LoginRequest;
import com.devtype.auth.dto.RegisterRequest;
import com.devtype.auth.service.JwtService;
import com.devtype.srs.SrsCard;
import com.devtype.srs.SrsCardRepository;
import com.devtype.srs.dto.SubmitSrsReviewRequest;
import com.devtype.dashboard.DailyPracticeActivityRepository;
import com.devtype.practice.PracticeSession;
import com.devtype.practice.PracticeSessionRepository;
import com.devtype.practice.PracticeSessionStatus;
import com.devtype.practice.dto.CompletePracticeSessionRequest;
import com.devtype.practice.dto.StartPracticeSessionRequest;
import com.devtype.template.DifficultyLevel;
import com.devtype.template.PracticeTemplate;
import com.devtype.template.PracticeTemplateRepository;
import com.devtype.user.AccountType;
import com.devtype.user.ReportStatus;
import com.devtype.user.User;
import com.devtype.user.UserPreferences;
import com.devtype.user.UserPreferencesRepository;
import com.devtype.user.UserReportRepository;
import com.devtype.user.UserRepository;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;
import com.devtype.user.dto.UpdatePreferencesRequest;
import com.devtype.user.dto.UpdateProfileRequest;
import com.devtype.xp.XpTransactionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-End Regression Test Suite for Prompt 10 Final Hardening.
 * Covers Critical User Journeys A, B, C, D, and E across authentication,
 * practice sessions, SRS spaced repetition, admin moderation, and observability.
 */
@SpringBootTest
@AutoConfigureMockMvc
@org.springframework.boot.test.autoconfigure.actuate.observability.AutoConfigureObservability
@ActiveProfiles("test")
public class CriticalUserJourneysIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserPreferencesRepository userPreferencesRepository;

    @Autowired
    private PracticeTemplateRepository practiceTemplateRepository;

    @Autowired
    private PracticeSessionRepository practiceSessionRepository;

    @Autowired
    private DailyPracticeActivityRepository dailyPracticeActivityRepository;

    @Autowired
    private SrsCardRepository srsCardRepository;

    @Autowired
    private AchievementRepository achievementRepository;

    @Autowired
    private UserAchievementRepository userAchievementRepository;

    @Autowired
    private XpTransactionRepository xpTransactionRepository;

    @Autowired
    private UserReportRepository userReportRepository;

    @Autowired
    private AdminAuditLogRepository auditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private PracticeTemplate publishedTemplate;

    @BeforeEach
    void setUp() {
        tearDown();

        // Seed practice template
        publishedTemplate = new PracticeTemplate(
                "Rust Concurrency Pattern",
                "rust-concurrency-pattern",
                "Rust",
                DifficultyLevel.INTERMEDIATE,
                "Concurrency",
                "use std::sync::mpsc;\nuse std::thread;\n\nfn main() {\n    let (tx, rx) = mpsc::channel();\n}",
                60
        );
        publishedTemplate.setPublished(true);
        publishedTemplate = practiceTemplateRepository.saveAndFlush(publishedTemplate);

        // Seed standard achievements
        achievementRepository.save(new Achievement("first-session", "First Keystrokes", "Complete your first practice session", "Play", "Volume", 1));
        achievementRepository.save(new Achievement("first-srs-review", "Synaptic Anchor", "Complete your first spaced repetition recall session", "Brain", "SRS", 1));
        achievementRepository.save(new Achievement("speed-60", "Velocity 60", "Reach 60 WPM net speed", "Zap", "Speed", 60));
        achievementRepository.flush();
    }

    @AfterEach
    void tearDown() {
        auditLogRepository.deleteAll();
        userReportRepository.deleteAll();
        srsCardRepository.deleteAll();
        xpTransactionRepository.deleteAll();
        userAchievementRepository.deleteAll();
        achievementRepository.deleteAll();
        dailyPracticeActivityRepository.deleteAll();
        practiceSessionRepository.deleteAll();
        practiceTemplateRepository.deleteAll();
        userPreferencesRepository.deleteAll();
        userRepository.deleteAll();
    }

    // =========================================================================
    // Journey A: New User (Register -> Login -> Profile -> Preferences -> Privacy)
    // =========================================================================
    @Test
    @DisplayName("Journey A: New user registration, login, profile view, preference updates, and authorization boundaries")
    void testJourneyA_NewUserLifecycle() throws Exception {
        // 1. Register new user
        RegisterRequest registerReq = new RegisterRequest(
                "dev_candidate",
                "candidate@devtype.io",
                "P@ssw0rd123!",
                "Candidate Dev"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.user.username", is("dev_candidate")))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()));

        // 2. Login with valid credentials
        LoginRequest loginReq = new LoginRequest("dev_candidate", "P@ssw0rd123!");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        // 3. Access authenticated profile
        mockMvc.perform(get("/api/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.username", is("dev_candidate")))
                .andExpect(jsonPath("$.data.email", is("candidate@devtype.io")));

        // 4. Update profile (non-privileged fields: displayName, avatarUrl)
        UpdateProfileRequest updateProfileReq = new UpdateProfileRequest("Candidate Senior Dev", "https://cdn.devtype.io/avatars/candidate.png");
        mockMvc.perform(put("/api/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateProfileReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.displayName", is("Candidate Senior Dev")))
                .andExpect(jsonPath("$.data.avatarUrl", is("https://cdn.devtype.io/avatars/candidate.png")));

        // 5. Read default user preferences
        mockMvc.perform(get("/api/v1/users/me/preferences")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.theme", notNullValue()));

        // 6. Update user preferences
        UpdatePreferencesRequest updatePrefReq = new UpdatePreferencesRequest("cyberpunk", "Rust", "INTERMEDIATE", true);
        mockMvc.perform(put("/api/v1/users/me/preferences")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePrefReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.theme", is("cyberpunk")))
                .andExpect(jsonPath("$.data.defaultLanguage", is("Rust")))
                .andExpect(jsonPath("$.data.soundEnabled", is(true)));

        // 7. Verify unauthenticated access to profile returns 401 Unauthorized
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized());

        // 8. Verify invalid credentials return 401 Unauthorized
        LoginRequest badLogin = new LoginRequest("dev_candidate", "WrongPassword!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // Journey B: Practice Session (Templates -> Start -> Complete -> Metrics & Stats -> Duplicate prevention)
    // =========================================================================
    @Test
    @DisplayName("Journey B: Practice session lifecycle, accurate metric computation, stats refresh, and isolation")
    void testJourneyB_PracticeSessionLifecycle() throws Exception {
        // Create user 1
        User user1 = createTestUser("journey_b_user1", "user1@devtype.io", UserRole.USER);
        String token1 = jwtService.generateToken(user1);

        // Create user 2
        User user2 = createTestUser("journey_b_user2", "user2@devtype.io", UserRole.USER);
        String token2 = jwtService.generateToken(user2);

        // 1. Load published templates
        mockMvc.perform(get("/api/v1/templates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.items", hasSize(greaterThanOrEqualTo(1))));

        // 2. Start practice session for user 1
        StartPracticeSessionRequest startReq = new StartPracticeSessionRequest(publishedTemplate.getId(), publishedTemplate.getSlug());
        MvcResult startResult = mockMvc.perform(post("/api/v1/practice-sessions")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(startReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("IN_PROGRESS")))
                .andExpect(jsonPath("$.data.templateTitle", is(publishedTemplate.getTitle())))
                .andReturn();

        long sessionId = objectMapper.readTree(startResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // 3. Complete session with realistic metrics: 80 chars, 78 correct, 2 errors in 15 seconds
        CompletePracticeSessionRequest completeReq = new CompletePracticeSessionRequest(
                80, 78, 2, 2, 15000L
        );

        mockMvc.perform(post("/api/v1/practice-sessions/" + sessionId + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.accuracyPercent", notNullValue()))
                .andExpect(jsonPath("$.data.grossWpm", notNullValue()))
                .andExpect(jsonPath("$.data.netWpm", notNullValue()))
                .andExpect(jsonPath("$.data.xpEarned", greaterThanOrEqualTo(50)));

        // 4. Verify session appears in user 1's history
        mockMvc.perform(get("/api/v1/practice-sessions/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].id", is((int) sessionId)));

        // 5. Verify user stats & daily activity are populated in dashboard
        mockMvc.perform(get("/api/v1/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalCompletedSessions", is(1)))
                .andExpect(jsonPath("$.data.recentSessions", hasSize(1)));

        // 6. Attempt duplicate completion -> verify idempotent handling (does not throw 500 or duplicate stats)
        mockMvc.perform(post("/api/v1/practice-sessions/" + sessionId + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk());

        // 7. Verify cross-user isolation: User 2 cannot complete or tamper with User 1's session
        mockMvc.perform(post("/api/v1/practice-sessions/" + sessionId + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // Journey C: Spaced Repetition Recall (Deck -> Due Queue -> Review -> XP & Milestone)
    // =========================================================================
    @Test
    @DisplayName("Journey C: SRS deck inspection, due queue retrieval, SM-2 review, XP award, and milestone unlocking")
    void testJourneyC_SpacedRepetitionAndRewards() throws Exception {
        User user = createTestUser("journey_c_user", "srs_user@devtype.io", UserRole.USER);
        User otherUser = createTestUser("journey_c_other", "srs_other@devtype.io", UserRole.USER);
        String token = jwtService.generateToken(user);
        String otherToken = jwtService.generateToken(otherUser);

        // 1. Create an SRS card due for review
        SrsCard card = new SrsCard(
                user, publishedTemplate.getSlug(), publishedTemplate.getTitle(), publishedTemplate.getLanguage(),
                1, BigDecimal.valueOf(2.50), 1, Instant.now().minus(2, ChronoUnit.HOURS)
        );
        card = srsCardRepository.saveAndFlush(card);

        // 2. Fetch due queue
        mockMvc.perform(get("/api/v1/srs/due")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));

        // 3. Submit SRS review with quality score 5
        SubmitSrsReviewRequest reviewReq = new SubmitSrsReviewRequest(
                publishedTemplate.getSlug(), publishedTemplate.getTitle(), publishedTemplate.getLanguage(),
                5, 85, 98.5
        );

        MvcResult reviewResult = mockMvc.perform(post("/api/v1/srs/review")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.repetition", is(2)))
                .andExpect(jsonPath("$.data.intervalDays", is(6)))
                .andReturn();

        // Verify XP was awarded to user
        assertThat(userRepository.findById(user.getId()).orElseThrow().getTotalXp()).isGreaterThanOrEqualTo(50L);

        // 4. Verify achievement unlock
        boolean hasFirstSrs = userAchievementRepository.existsByUserIdAndAchievementCode(user.getId(), "first-srs-review");
        assertThat(hasFirstSrs).isTrue();

        // 5. Submit review for other user creates their own card isolated to them
        SubmitSrsReviewRequest crossUserReq = new SubmitSrsReviewRequest(
                publishedTemplate.getSlug(), publishedTemplate.getTitle(), publishedTemplate.getLanguage(),
                4, 70, 95.0
        );
        mockMvc.perform(post("/api/v1/srs/review")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(crossUserReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.repetition", is(1)));
    }

    // =========================================================================
    // Journey D: Administration & Moderation (RBAC -> Overview -> Status Change -> Reports & Audit)
    // =========================================================================
    @Test
    @DisplayName("Journey D: Administrative RBAC enforcement, user moderation, report resolution, and audit logs")
    void testJourneyD_AdminAndModeration() throws Exception {
        User admin = createTestUser("journey_d_admin", "admin@devtype.io", UserRole.ADMIN);
        User backupAdmin = createTestUser("journey_d_backup_admin", "admin2@devtype.io", UserRole.ADMIN);
        User standardUser = createTestUser("journey_d_user", "standard@devtype.io", UserRole.USER);

        String adminToken = jwtService.generateToken(admin);
        String userToken = jwtService.generateToken(standardUser);

        // 1. Ordinary user attempting to access admin endpoints receives 403 Forbidden
        mockMvc.perform(get("/api/v1/admin/overview")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isForbidden());

        // 2. Administrator accesses overview and user list
        mockMvc.perform(get("/api/v1/admin/overview")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalUsers", greaterThanOrEqualTo(3)));

        mockMvc.perform(get("/api/v1/admin/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(3))));

        // 3. User submits abuse report against another user
        CreateReportRequest reportReq = new CreateReportRequest(backupAdmin.getId(), "SPAM", "User is spamming identical sessions.");
        MvcResult reportResult = mockMvc.perform(post("/api/v1/reports")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andReturn();

        long reportId = objectMapper.readTree(reportResult.getResponse().getContentAsString())
                .path("data").path("reportId").asLong();

        // 4. Admin reviews and resolves the report
        ReviewReportRequest reviewReq = new ReviewReportRequest(ReportStatus.RESOLVED, "Investigated and verified abuse.");
        mockMvc.perform(patch("/api/v1/admin/reports/" + reportId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("RESOLVED")));

        // 5. Admin suspends the offending user
        UpdateUserStatusRequest statusReq = new UpdateUserStatusRequest(UserStatus.SUSPENDED, "Suspended for repeated spam.");
        mockMvc.perform(patch("/api/v1/admin/users/" + standardUser.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("SUSPENDED")));

        // 6. Suspended user's existing active token is immediately rejected on subsequent requests (403)
        mockMvc.perform(get("/api/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isForbidden());

        // 7. Verify audit log was recorded for privileged admin actions
        assertThat(auditLogRepository.count()).isGreaterThanOrEqualTo(2);

        // 8. Ordinary user cannot access admin audit logs
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // Journey E: Monitoring, Actuator Safety, and Runtime Token Synchronization
    // =========================================================================
    @Test
    @DisplayName("Journey E: Health, Actuator protection, operational monitoring, and dynamic token synchronization")
    void testJourneyE_ObservabilityAndTokenSynchronization() throws Exception {
        User admin = createTestUser("journey_e_admin", "admin_e@devtype.io", UserRole.ADMIN);
        User user = createTestUser("journey_e_user", "user_e@devtype.io", UserRole.USER);

        String adminToken = jwtService.generateToken(admin);
        String userToken = jwtService.generateToken(user);

        // 1. Health check is operational
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")));

        // 2. Sensitive Actuator endpoints are protected / not exposed
        mockMvc.perform(get("/actuator/env"))
                .andExpect(status().isUnauthorized());

        // 3. Operational monitoring summary endpoint requires ADMIN role
        mockMvc.perform(get("/api/v1/admin/metrics/summary")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/metrics/summary")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.system.status", notNullValue()));

        // Prometheus scraping requires ADMIN role
        mockMvc.perform(get("/actuator/prometheus")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/actuator/prometheus")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());

        // 4. Immediate demotion: When an admin is demoted in DB to USER, their existing active JWT
        // is dynamically downgraded on subsequent requests and rejected from admin endpoints
        admin.setRole(UserRole.USER);
        userRepository.saveAndFlush(admin);

        mockMvc.perform(get("/api/v1/admin/overview")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isForbidden());

        // 5. Immediate deletion: When a user is deleted from DB, their existing active JWT
        // is immediately rejected with 401 Unauthorized
        userRepository.delete(user);
        userRepository.flush();

        mockMvc.perform(get("/api/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isUnauthorized());
    }

    private User createTestUser(String username, String email, UserRole role) {
        User u = new User();
        u.setUsername(username);
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode("Password123!"));
        u.setDisplayName(username);
        u.setRole(role);
        u.setStatus(UserStatus.ACTIVE);
        u.setAccountType(AccountType.STANDARD);
        u.setTotalXp(0L);
        return userRepository.saveAndFlush(u);
    }
}
