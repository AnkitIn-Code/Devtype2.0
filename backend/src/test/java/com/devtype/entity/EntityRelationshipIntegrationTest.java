package com.devtype.entity;

import com.devtype.achievement.Achievement;
import com.devtype.achievement.AchievementRepository;
import com.devtype.achievement.UserAchievement;
import com.devtype.achievement.UserAchievementRepository;
import com.devtype.srs.SrsCard;
import com.devtype.srs.SrsCardRepository;
import com.devtype.dashboard.DailyPracticeActivity;
import com.devtype.dashboard.DailyPracticeActivityRepository;
import com.devtype.practice.PracticeSession;
import com.devtype.practice.PracticeSessionRepository;
import com.devtype.practice.PracticeSessionStatus;
import com.devtype.template.DifficultyLevel;
import com.devtype.template.PracticeTemplate;
import com.devtype.template.PracticeTemplateRepository;
import com.devtype.user.AccountType;
import com.devtype.user.ReportStatus;
import com.devtype.user.User;
import com.devtype.user.UserPreferences;
import com.devtype.user.UserPreferencesRepository;
import com.devtype.user.UserReport;
import com.devtype.user.UserReportRepository;
import com.devtype.user.UserRepository;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Comprehensive integration tests for JPA entities, relationships, ownership isolation,
 * uniqueness constraints, and lifecycle behavior.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EntityRelationshipIntegrationTest {

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
    private AchievementRepository achievementRepository;

    @Autowired
    private UserAchievementRepository userAchievementRepository;

    @Autowired
    private SrsCardRepository srsCardRepository;

    @Autowired
    private UserReportRepository userReportRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("User and UserPreferences 1:1 relationship persistence and isolation")
    void testUserAndPreferencesRelationship() {
        User user = new User("dev_alice", "alice@devtype.io", "hashed_pwd_123", "Alice Coder");
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user.setAccountType(AccountType.STANDARD);
        User savedUser = userRepository.saveAndFlush(user);

        UserPreferences prefs = new UserPreferences(savedUser);
        prefs.setTheme("monokai");
        prefs.setDefaultLanguage("typescript");
        prefs.setDefaultDifficulty("ADVANCED");
        prefs.setSoundEnabled(false);
        userPreferencesRepository.saveAndFlush(prefs);

        entityManager.clear();

        Optional<UserPreferences> retrieved = userPreferencesRepository.findByUserId(savedUser.getId());
        assertThat(retrieved).isPresent();
        assertThat(retrieved.get().getUser().getUsername()).isEqualTo("dev_alice");
        assertThat(retrieved.get().getTheme()).isEqualTo("monokai");
        assertThat(retrieved.get().getDefaultLanguage()).isEqualTo("typescript");
        assertThat(retrieved.get().getDefaultDifficulty()).isEqualTo("ADVANCED");
        assertThat(retrieved.get().isSoundEnabled()).isFalse();
        assertThat(retrieved.get().getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Unique constraint enforcement on User username and email")
    void testUserUniquenessConstraints() {
        User user1 = new User("unique_user", "unique@devtype.io", "hash1", "Unique One");
        userRepository.saveAndFlush(user1);

        // Attempt duplicate username
        User dupUser = new User("unique_user", "other@devtype.io", "hash2", "Duplicate Username");
        assertThatThrownBy(() -> {
            userRepository.saveAndFlush(dupUser);
        }).isInstanceOf(DataIntegrityViolationException.class);

        entityManager.clear();

        // Attempt duplicate email
        User dupEmail = new User("other_user", "unique@devtype.io", "hash3", "Duplicate Email");
        assertThatThrownBy(() -> {
            userRepository.saveAndFlush(dupEmail);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Practice template creation and PracticeSession user ownership isolation")
    void testPracticeSessionIsolationAndSnapshots() {
        User user1 = userRepository.saveAndFlush(new User("coder_one", "c1@devtype.io", "hash", "Coder One"));
        User user2 = userRepository.saveAndFlush(new User("coder_two", "c2@devtype.io", "hash", "Coder Two"));

        PracticeTemplate template = new PracticeTemplate(
                "Binary Search in Go", "go-binary-search", "go",
                DifficultyLevel.INTERMEDIATE, "Algorithms", "func search() {}", 60);
        PracticeTemplate savedTemplate = practiceTemplateRepository.saveAndFlush(template);

        PracticeSession session1 = new PracticeSession(
                user1, savedTemplate, savedTemplate.getTitle(),
                savedTemplate.getLanguage(), savedTemplate.getDifficulty().name(), Instant.now());
        session1.setDurationMs(45000L);
        session1.setGrossWpm(new BigDecimal("78.50"));
        session1.setNetWpm(new BigDecimal("74.20"));
        session1.setAccuracyPercent(new BigDecimal("96.80"));
        session1.setCorrectCharacters(320);
        session1.setIncorrectCharacters(8);
        session1.setTotalCharacters(328);
        session1.setErrorCount(8);
        session1.setStatus(PracticeSessionStatus.COMPLETED);
        session1.setCompletedAt(Instant.now());
        practiceSessionRepository.saveAndFlush(session1);

        PracticeSession session2 = new PracticeSession(
                user2, savedTemplate, savedTemplate.getTitle(),
                savedTemplate.getLanguage(), savedTemplate.getDifficulty().name(), Instant.now());
        session2.setStatus(PracticeSessionStatus.IN_PROGRESS);
        practiceSessionRepository.saveAndFlush(session2);

        entityManager.clear();

        // Verify User 1 only sees their own sessions
        List<PracticeSession> user1Sessions = practiceSessionRepository
                .findByUserIdAndStatusOrderByStartedAtDesc(user1.getId(), PracticeSessionStatus.COMPLETED);
        assertThat(user1Sessions).hasSize(1);
        assertThat(user1Sessions.get(0).getTemplateTitleSnapshot()).isEqualTo("Binary Search in Go");
        assertThat(user1Sessions.get(0).getNetWpm()).isEqualTo(new BigDecimal("74.20"));

        List<PracticeSession> user2Sessions = practiceSessionRepository
                .findByUserIdAndStatusOrderByStartedAtDesc(user2.getId(), PracticeSessionStatus.COMPLETED);
        assertThat(user2Sessions).isEmpty();
    }

    @Test
    @DisplayName("Daily practice activity persistence and uniqueness by (user_id, activity_date)")
    void testDailyPracticeActivityHeatmapPersistence() {
        User user = userRepository.saveAndFlush(new User("streak_master", "streak@devtype.io", "hash", "Streaker"));
        LocalDate today = LocalDate.now();

        DailyPracticeActivity activity = new DailyPracticeActivity(user, today);
        activity.setSessionCount(5);
        activity.setTotalPracticeSeconds(1200L);
        activity.setTotalCharacters(4500);
        dailyPracticeActivityRepository.saveAndFlush(activity);

        entityManager.clear();

        Optional<DailyPracticeActivity> retrieved = dailyPracticeActivityRepository
                .findByUserIdAndActivityDate(user.getId(), today);
        assertThat(retrieved).isPresent();
        assertThat(retrieved.get().getSessionCount()).isEqualTo(5);
        assertThat(retrieved.get().getTotalPracticeSeconds()).isEqualTo(1200L);
        assertThat(retrieved.get().getTotalCharacters()).isEqualTo(4500);

        // Attempting a second record for the same user and date must violate unique constraint
        DailyPracticeActivity duplicate = new DailyPracticeActivity(user, today);
        assertThatThrownBy(() -> {
            dailyPracticeActivityRepository.saveAndFlush(duplicate);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Platform achievements and UserAchievement uniqueness constraint")
    void testAchievementsAndUserAchievements() {
        User user = userRepository.saveAndFlush(new User("achiever", "achiever@devtype.io", "hash", "Achiever"));

        Achievement achievement = new Achievement(
                "SPEED_DEMON_100", "Speed Demon", "Achieve 100 WPM in any language drill",
                "flame-icon", "speed", 100);
        Achievement savedAchievement = achievementRepository.saveAndFlush(achievement);

        UserAchievement ua = new UserAchievement(user, savedAchievement, Instant.now());
        ua.setProgress(100);
        userAchievementRepository.saveAndFlush(ua);

        entityManager.clear();

        List<UserAchievement> userBadges = userAchievementRepository.findByUserId(user.getId());
        assertThat(userBadges).hasSize(1);
        assertThat(userBadges.get(0).getAchievement().getCode()).isEqualTo("SPEED_DEMON_100");

        // Attempting to award duplicate achievement to same user must fail
        UserAchievement duplicate = new UserAchievement(user, savedAchievement, Instant.now());
        assertThatThrownBy(() -> {
            userAchievementRepository.saveAndFlush(duplicate);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("SRS card persistence, user ownership, and SM-2 fields")
    void testSrsCardLifecycle() {
        User user = userRepository.saveAndFlush(new User("srs_learner", "srs@devtype.io", "hash", "SRS Learner"));

        PracticeTemplate template = new PracticeTemplate(
                "Rust Concurrency Pattern", "rust-concurrency-pattern", "rust",
                DifficultyLevel.ADVANCED, "Concurrency", "use std::sync::mpsc;", 60);
        PracticeTemplate savedTemplate = practiceTemplateRepository.saveAndFlush(template);

        SrsCard card = new SrsCard(
                user, savedTemplate.getSlug(), savedTemplate.getTitle(), savedTemplate.getLanguage(),
                2, new BigDecimal("2.60"), 6, Instant.now()
        );
        srsCardRepository.saveAndFlush(card);

        entityManager.clear();

        List<SrsCard> userCards = srsCardRepository.findByUserId(user.getId());
        assertThat(userCards).hasSize(1);
        assertThat(userCards.get(0).getSnippetId()).isEqualTo("rust-concurrency-pattern");
        assertThat(userCards.get(0).getRepetition()).isEqualTo(2);
        assertThat(userCards.get(0).getEaseFactor()).isEqualTo(new BigDecimal("2.60"));
    }

    @Test
    @DisplayName("User reports moderation entity lifecycle and status transitions")
    void testUserReportsModerationLifecycle() {
        User reporter = userRepository.saveAndFlush(new User("reporter", "reporter@devtype.io", "hash", "Reporter"));
        User badActor = userRepository.saveAndFlush(new User("badactor", "bad@devtype.io", "hash", "Bad Actor"));
        User admin = userRepository.saveAndFlush(new User("admin_mod", "admin@devtype.io", "hash", "Admin Mod"));
        admin.setRole(UserRole.ADMIN);
        userRepository.saveAndFlush(admin);

        UserReport report = new UserReport(
                reporter, badActor, "CODE_OF_CONDUCT", "Inappropriate username and profile text");
        UserReport savedReport = userReportRepository.saveAndFlush(report);

        assertThat(savedReport.getStatus()).isEqualTo(ReportStatus.OPEN);
        assertThat(savedReport.getCreatedAt()).isNotNull();

        // Moderation workflow update
        savedReport.setStatus(ReportStatus.RESOLVED);
        savedReport.setReviewedByUser(admin);
        savedReport.setReviewedAt(Instant.now());
        userReportRepository.saveAndFlush(savedReport);

        entityManager.clear();

        Optional<UserReport> retrieved = userReportRepository.findById(savedReport.getId());
        assertThat(retrieved).isPresent();
        assertThat(retrieved.get().getStatus()).isEqualTo(ReportStatus.RESOLVED);
        assertThat(retrieved.get().getReviewedByUser().getUsername()).isEqualTo("admin_mod");
        assertThat(retrieved.get().getReporter().getUsername()).isEqualTo("reporter");
        assertThat(retrieved.get().getReportedUser().getUsername()).isEqualTo("badactor");
    }
}
