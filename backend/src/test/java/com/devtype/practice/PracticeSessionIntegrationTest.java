package com.devtype.practice;

import com.devtype.auth.service.JwtService;
import com.devtype.dashboard.DailyPracticeActivity;
import com.devtype.dashboard.DailyPracticeActivityRepository;
import com.devtype.practice.dto.CompletePracticeSessionRequest;
import com.devtype.practice.dto.StartPracticeSessionRequest;
import com.devtype.template.DifficultyLevel;
import com.devtype.template.PracticeTemplate;
import com.devtype.template.PracticeTemplateRepository;
import com.devtype.user.AccountType;
import com.devtype.user.User;
import com.devtype.user.UserRepository;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PracticeSessionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PracticeTemplateRepository practiceTemplateRepository;

    @Autowired
    private PracticeSessionRepository practiceSessionRepository;

    @Autowired
    private DailyPracticeActivityRepository dailyPracticeActivityRepository;

    @Autowired
    private JwtService jwtService;

    private User primaryUser;
    private User otherUser;
    private String primaryToken;
    private String otherToken;
    private PracticeTemplate publishedTemplate;
    private PracticeTemplate unpublishedTemplate;

    @BeforeEach
    void setUp() {
        dailyPracticeActivityRepository.deleteAll();
        practiceSessionRepository.deleteAll();
        practiceTemplateRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create primary test user
        primaryUser = new User();
        primaryUser.setUsername("alice_dev");
        primaryUser.setEmail("alice@devtype.io");
        primaryUser.setPasswordHash("hashed_password");
        primaryUser.setDisplayName("Alice Developer");
        primaryUser.setRole(UserRole.USER);
        primaryUser.setStatus(UserStatus.ACTIVE);
        primaryUser.setAccountType(AccountType.STANDARD);
        primaryUser = userRepository.saveAndFlush(primaryUser);
        primaryToken = jwtService.generateToken(primaryUser);

        // 2. Create second user for authorization boundary testing
        otherUser = new User();
        otherUser.setUsername("bob_dev");
        otherUser.setEmail("bob@devtype.io");
        otherUser.setPasswordHash("hashed_password");
        otherUser.setDisplayName("Bob Developer");
        otherUser.setRole(UserRole.USER);
        otherUser.setStatus(UserStatus.ACTIVE);
        otherUser.setAccountType(AccountType.STANDARD);
        otherUser = userRepository.saveAndFlush(otherUser);
        otherToken = jwtService.generateToken(otherUser);

        // 3. Create published and unpublished templates
        publishedTemplate = new PracticeTemplate(
                "Java Binary Search",
                "java-binary-search",
                "Java",
                DifficultyLevel.INTERMEDIATE,
                "Algorithms",
                "public class BinarySearch {\n    public int search(int[] nums, int target) {\n        return -1;\n    }\n}",
                60
        );
        publishedTemplate.setPublished(true);
        publishedTemplate = practiceTemplateRepository.saveAndFlush(publishedTemplate);

        unpublishedTemplate = new PracticeTemplate(
                "Draft Algorithm",
                "draft-algo",
                "Python",
                DifficultyLevel.ADVANCED,
                "Algorithms",
                "def draft(): pass",
                30
        );
        unpublishedTemplate.setPublished(false);
        unpublishedTemplate = practiceTemplateRepository.saveAndFlush(unpublishedTemplate);
    }

    @Test
    @DisplayName("Starting practice session creates IN_PROGRESS record with template snapshot")
    void testStartSession_Success() throws Exception {
        StartPracticeSessionRequest request = new StartPracticeSessionRequest(publishedTemplate.getId(), null);

        mockMvc.perform(post("/api/v1/practice-sessions")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + primaryToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.status", is("IN_PROGRESS")))
                .andExpect(jsonPath("$.data.templateTitle", is(publishedTemplate.getTitle())))
                .andExpect(jsonPath("$.data.language", is(publishedTemplate.getLanguage())))
                .andExpect(jsonPath("$.data.difficulty", is("INTERMEDIATE")));

        assertThat(practiceSessionRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Starting session without authentication returns 401 Unauthorized")
    void testStartSession_Unauthenticated() throws Exception {
        StartPracticeSessionRequest request = new StartPracticeSessionRequest(publishedTemplate.getId(), null);

        mockMvc.perform(post("/api/v1/practice-sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Starting session for unpublished template returns 404 Not Found")
    void testStartSession_UnpublishedTemplateReturnsNotFound() throws Exception {
        StartPracticeSessionRequest request = new StartPracticeSessionRequest(unpublishedTemplate.getId(), null);

        mockMvc.perform(post("/api/v1/practice-sessions")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + primaryToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Completing session updates metrics, marks COMPLETED, and transactionally updates daily activity")
    void testCompleteSession_Success() throws Exception {
        // 1. Start a session
        PracticeSession session = new PracticeSession(
                primaryUser, publishedTemplate, publishedTemplate.getTitle(),
                publishedTemplate.getLanguage(), publishedTemplate.getDifficulty().name(),
                Instant.now().minus(20, ChronoUnit.SECONDS)
        );
        session.setSourceContentSnapshot(publishedTemplate.getContent());
        session.setStatus(PracticeSessionStatus.IN_PROGRESS);
        session = practiceSessionRepository.saveAndFlush(session);

        // 2. Submit completion
        int totalChars = publishedTemplate.getContent().length();
        CompletePracticeSessionRequest completeReq = new CompletePracticeSessionRequest(
                totalChars + 2, totalChars, 2, 2, 20000L
        );

        MvcResult result = mockMvc.perform(post("/api/v1/practice-sessions/" + session.getId() + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + primaryToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.durationMs", notNullValue()))
                .andExpect(jsonPath("$.data.netWpm", notNullValue()))
                .andExpect(jsonPath("$.data.accuracyPercent", notNullValue()))
                .andReturn();

        // 3. Verify daily activity was created
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Optional<DailyPracticeActivity> activityOpt = dailyPracticeActivityRepository
                .findByUserIdAndActivityDate(primaryUser.getId(), today);
        assertThat(activityOpt).isPresent();
        DailyPracticeActivity activity = activityOpt.get();
        assertThat(activity.getSessionCount()).isEqualTo(1);
        assertThat(activity.getTotalCharacters()).isGreaterThanOrEqualTo(totalChars);
    }

    @Test
    @DisplayName("Completing another user's practice session is rejected with 403 Forbidden")
    void testCompleteSession_UnauthorizedUserForbidden() throws Exception {
        PracticeSession session = new PracticeSession(
                primaryUser, publishedTemplate, publishedTemplate.getTitle(),
                publishedTemplate.getLanguage(), publishedTemplate.getDifficulty().name(),
                Instant.now().minus(15, ChronoUnit.SECONDS)
        );
        session.setSourceContentSnapshot(publishedTemplate.getContent());
        session.setStatus(PracticeSessionStatus.IN_PROGRESS);
        session = practiceSessionRepository.saveAndFlush(session);

        CompletePracticeSessionRequest completeReq = new CompletePracticeSessionRequest(
                60, 60, 0, 0, 15000L
        );

        // Attempt completion using Bob's token on Alice's session
        mockMvc.perform(post("/api/v1/practice-sessions/" + session.getId() + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Duplicate completion request is handled idempotently without double-incrementing daily activity")
    void testCompleteSession_Idempotent() throws Exception {
        PracticeSession session = new PracticeSession(
                primaryUser, publishedTemplate, publishedTemplate.getTitle(),
                publishedTemplate.getLanguage(), publishedTemplate.getDifficulty().name(),
                Instant.now().minus(25, ChronoUnit.SECONDS)
        );
        session.setSourceContentSnapshot(publishedTemplate.getContent());
        session.setStatus(PracticeSessionStatus.IN_PROGRESS);
        session = practiceSessionRepository.saveAndFlush(session);

        CompletePracticeSessionRequest completeReq = new CompletePracticeSessionRequest(
                70, 70, 0, 0, 25000L
        );

        // First completion
        mockMvc.perform(post("/api/v1/practice-sessions/" + session.getId() + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + primaryToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk());

        // Repeated completion request
        mockMvc.perform(post("/api/v1/practice-sessions/" + session.getId() + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + primaryToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk());

        // Verify daily activity session count is still 1, NOT 2
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        DailyPracticeActivity activity = dailyPracticeActivityRepository
                .findByUserIdAndActivityDate(primaryUser.getId(), today)
                .orElseThrow();
        assertThat(activity.getSessionCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("Impossible typing speed (>350 WPM) is rejected with 400 Bad Request")
    void testCompleteSession_ImpossibleSpeedRejected() throws Exception {
        PracticeSession session = new PracticeSession(
                primaryUser, publishedTemplate, publishedTemplate.getTitle(),
                publishedTemplate.getLanguage(), publishedTemplate.getDifficulty().name(),
                Instant.now().minus(1, ChronoUnit.SECONDS)
        );
        session.setSourceContentSnapshot(publishedTemplate.getContent());
        session.setStatus(PracticeSessionStatus.IN_PROGRESS);
        session = practiceSessionRepository.saveAndFlush(session);

        // 80 characters typed in 1000ms = 960 WPM
        CompletePracticeSessionRequest cheatReq = new CompletePracticeSessionRequest(
                80, 80, 0, 0, 1000L
        );

        mockMvc.perform(post("/api/v1/practice-sessions/" + session.getId() + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + primaryToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cheatReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Abandoning session sets status ABANDONED and does not increment daily activity")
    void testAbandonSession_Success() throws Exception {
        PracticeSession session = new PracticeSession(
                primaryUser, publishedTemplate, publishedTemplate.getTitle(),
                publishedTemplate.getLanguage(), publishedTemplate.getDifficulty().name(),
                Instant.now().minus(10, ChronoUnit.SECONDS)
        );
        session.setStatus(PracticeSessionStatus.IN_PROGRESS);
        session = practiceSessionRepository.saveAndFlush(session);

        mockMvc.perform(post("/api/v1/practice-sessions/" + session.getId() + "/abandon")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + primaryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ABANDONED")));

        PracticeSession updated = practiceSessionRepository.findById(session.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(PracticeSessionStatus.ABANDONED);

        // Verify daily activity is 0
        assertThat(dailyPracticeActivityRepository.count()).isEqualTo(0);
    }

    @Test
    @DisplayName("Cannot abandon an already completed session")
    void testAbandonSession_CannotAbandonCompletedSession() throws Exception {
        PracticeSession session = new PracticeSession(
                primaryUser, publishedTemplate, publishedTemplate.getTitle(),
                publishedTemplate.getLanguage(), publishedTemplate.getDifficulty().name(),
                Instant.now().minus(20, ChronoUnit.SECONDS)
        );
        session.setStatus(PracticeSessionStatus.COMPLETED);
        session.setCompletedAt(Instant.now());
        session = practiceSessionRepository.saveAndFlush(session);

        mockMvc.perform(post("/api/v1/practice-sessions/" + session.getId() + "/abandon")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + primaryToken))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Listing user sessions returns only authenticated user's records with pagination")
    void testListUserSessions_IsolationAndPagination() throws Exception {
        // Seed 3 sessions for Alice
        for (int i = 0; i < 3; i++) {
            PracticeSession s = new PracticeSession(
                    primaryUser, publishedTemplate, "Alice Snippet " + i,
                    "Java", "INTERMEDIATE", Instant.now().minus(i + 1, ChronoUnit.HOURS)
            );
            s.setStatus(PracticeSessionStatus.COMPLETED);
            practiceSessionRepository.save(s);
        }

        // Seed 2 sessions for Bob
        for (int i = 0; i < 2; i++) {
            PracticeSession s = new PracticeSession(
                    otherUser, publishedTemplate, "Bob Snippet " + i,
                    "Python", "BEGINNER", Instant.now().minus(i + 1, ChronoUnit.HOURS)
            );
            s.setStatus(PracticeSessionStatus.COMPLETED);
            practiceSessionRepository.save(s);
        }

        // Alice queries her sessions
        mockMvc.perform(get("/api/v1/practice-sessions/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + primaryToken)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(3)))
                .andExpect(jsonPath("$.data.totalElements", is(3)));

        // Bob queries his sessions
        mockMvc.perform(get("/api/v1/practice-sessions/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(2)))
                .andExpect(jsonPath("$.data.totalElements", is(2)));
    }

    @Test
    @DisplayName("Dashboard summary endpoint calculates aggregates, streak, and heatmap points")
    void testDashboard_SummarySuccess() throws Exception {
        // Seed completed practice sessions for Alice on 2 consecutive days
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate yesterday = today.minusDays(1);

        PracticeSession s1 = new PracticeSession(
                primaryUser, publishedTemplate, "Binary Search", "Java", "INTERMEDIATE",
                yesterday.atTime(10, 0).toInstant(ZoneOffset.UTC)
        );
        s1.setStatus(PracticeSessionStatus.COMPLETED);
        s1.setGrossWpm(BigDecimal.valueOf(70.00));
        s1.setNetWpm(BigDecimal.valueOf(65.00));
        s1.setAccuracyPercent(BigDecimal.valueOf(98.00));
        s1.setDurationMs(30000L);
        s1.setTotalCharacters(175);
        practiceSessionRepository.save(s1);

        DailyPracticeActivity act1 = new DailyPracticeActivity(primaryUser, yesterday);
        act1.setSessionCount(1);
        act1.setTotalPracticeSeconds(30L);
        act1.setTotalCharacters(175);
        dailyPracticeActivityRepository.save(act1);

        PracticeSession s2 = new PracticeSession(
                primaryUser, publishedTemplate, "Binary Search 2", "Java", "INTERMEDIATE",
                today.atTime(12, 0).toInstant(ZoneOffset.UTC)
        );
        s2.setStatus(PracticeSessionStatus.COMPLETED);
        s2.setGrossWpm(BigDecimal.valueOf(80.00));
        s2.setNetWpm(BigDecimal.valueOf(75.00));
        s2.setAccuracyPercent(BigDecimal.valueOf(99.00));
        s2.setDurationMs(25000L);
        s2.setTotalCharacters(175);
        practiceSessionRepository.save(s2);

        DailyPracticeActivity act2 = new DailyPracticeActivity(primaryUser, today);
        act2.setSessionCount(1);
        act2.setTotalPracticeSeconds(25L);
        act2.setTotalCharacters(175);
        dailyPracticeActivityRepository.save(act2);

        // Query dashboard via /api/v1/dashboard
        mockMvc.perform(get("/api/v1/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + primaryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalCompletedSessions", is(2)))
                .andExpect(jsonPath("$.data.bestWpm", is(75.00)))
                .andExpect(jsonPath("$.data.averageWpm", is(70.00)))
                .andExpect(jsonPath("$.data.currentStreak", is(2)))
                .andExpect(jsonPath("$.data.bestStreak", is(2)))
                .andExpect(jsonPath("$.data.recentSessions", hasSize(2)))
                .andExpect(jsonPath("$.data.dailyActivity", hasSize(2)));

        // Query dashboard via /api/v1/users/me/dashboard
        mockMvc.perform(get("/api/v1/users/me/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + primaryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalCompletedSessions", is(2)));
    }

    @Test
    @DisplayName("Dashboard summary for user with zero sessions returns clean zero state")
    void testDashboard_NewUserZeroSessions() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + primaryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalCompletedSessions", is(0)))
                .andExpect(jsonPath("$.data.currentStreak", is(0)))
                .andExpect(jsonPath("$.data.bestStreak", is(0)))
                .andExpect(jsonPath("$.data.recentSessions", hasSize(0)));
    }
}
