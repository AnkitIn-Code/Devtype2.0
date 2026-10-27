package com.devtype.demo;

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
import com.devtype.template.PracticeTemplate;
import com.devtype.template.PracticeTemplateRepository;
import com.devtype.user.AccountType;
import com.devtype.user.User;
import com.devtype.user.UserPreferences;
import com.devtype.user.UserPreferencesRepository;
import com.devtype.user.UserRepository;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DemoDataSeederIntegrationTest {

    @Autowired
    private DemoDataSeederService seederService;

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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private DemoDataProperties demoDataProperties;

    @Test
    @DisplayName("1. Demo seeding creates expected demo accounts when explicitly executed")
    void testDemoSeedingCreatesExpectedAccounts() {
        DemoSeedReport report = seederService.seedAllDemoData();

        assertThat(report.usersCreated()).isEqualTo(3);

        Optional<User> ace = userRepository.findByUsername("demo_ace");
        Optional<User> beginner = userRepository.findByUsername("demo_beginner");
        Optional<User> consistent = userRepository.findByUsername("demo_consistent");

        assertThat(ace).isPresent();
        assertThat(beginner).isPresent();
        assertThat(consistent).isPresent();

        assertThat(ace.get().getEmail()).isEqualTo("demo_ace@example.com");
        assertThat(beginner.get().getEmail()).isEqualTo("demo_beginner@example.com");
        assertThat(consistent.get().getEmail()).isEqualTo("demo_consistent@example.com");
    }

    @Test
    @DisplayName("2. Demo accounts are marked with DEMO account type and USER role (never ADMIN)")
    void testDemoAccountTypesAndRoles() {
        seederService.seedAllDemoData();

        List<String> demoUsernames = List.of("demo_ace", "demo_beginner", "demo_consistent");
        for (String username : demoUsernames) {
            User user = userRepository.findByUsername(username).orElseThrow();
            assertThat(user.getAccountType())
                    .as("Account type for %s must be DEMO", username)
                    .isEqualTo(AccountType.DEMO);
            assertThat(user.getRole())
                    .as("Role for %s must never be ADMIN", username)
                    .isEqualTo(UserRole.USER);
            assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);

            // User preferences must exist
            Optional<UserPreferences> prefs = userPreferencesRepository.findByUserId(user.getId());
            assertThat(prefs).isPresent();
            assertThat(prefs.get().getTheme()).isEqualTo("dark");
        }
    }

    @Test
    @DisplayName("3. Passwords are stored strictly as BCrypt hashes, never plaintext")
    void testPasswordsStoredAsHashes() {
        seederService.seedAllDemoData();

        String configuredPassword = demoDataProperties.getDefaultPassword();
        assertThat(configuredPassword).isNotBlank();

        List<String> demoUsernames = List.of("demo_ace", "demo_beginner", "demo_consistent");
        for (String username : demoUsernames) {
            User user = userRepository.findByUsername(username).orElseThrow();
            String hash = user.getPasswordHash();

            assertThat(hash)
                    .as("Password hash must not be null or blank")
                    .isNotBlank();
            assertThat(hash)
                    .as("Password must not be stored in plaintext")
                    .isNotEqualTo(configuredPassword);
            assertThat(hash)
                    .as("Password hash must be a valid BCrypt hash format")
                    .startsWith("$2a$");
            assertThat(passwordEncoder.matches(configuredPassword, hash))
                    .as("BCrypt encoder must verify against the configured demo password")
                    .isTrue();
        }
    }

    @Test
    @DisplayName("4. Re-running the seeder is completely idempotent and produces no duplicates")
    void testIdempotentRepeatedExecution() {
        DemoSeedReport firstRun = seederService.seedAllDemoData();
        assertThat(firstRun.hasAnyCreated()).isTrue();

        long usersBefore = userRepository.count();
        long templatesBefore = practiceTemplateRepository.count();
        long achievementsBefore = achievementRepository.count();
        long srsCardsBefore = srsCardRepository.count();
        long sessionsBefore = practiceSessionRepository.count();
        long activitiesBefore = dailyPracticeActivityRepository.count();
        long userAchievementsBefore = userAchievementRepository.count();

        // Second run
        DemoSeedReport secondRun = seederService.seedAllDemoData();

        assertThat(secondRun.usersCreated()).isZero();
        assertThat(secondRun.usersSkipped()).isEqualTo(3);
        assertThat(secondRun.templatesCreated()).isZero();
        assertThat(secondRun.templatesSkipped()).isEqualTo((int) templatesBefore);
        assertThat(secondRun.achievementsCreated()).isZero();
        assertThat(secondRun.srsCardsCreated()).isZero();
        assertThat(secondRun.sessionsCreated()).isZero();
        assertThat(secondRun.activityRecordsCreated()).isZero();
        assertThat(secondRun.userAchievementsCreated()).isZero();

        // Exact counts in database must remain completely unaltered
        assertThat(userRepository.count()).isEqualTo(usersBefore);
        assertThat(practiceTemplateRepository.count()).isEqualTo(templatesBefore);
        assertThat(achievementRepository.count()).isEqualTo(achievementsBefore);
        assertThat(srsCardRepository.count()).isEqualTo(srsCardsBefore);
        assertThat(practiceSessionRepository.count()).isEqualTo(sessionsBefore);
        assertThat(dailyPracticeActivityRepository.count()).isEqualTo(activitiesBefore);
        assertThat(userAchievementRepository.count()).isEqualTo(userAchievementsBefore);
    }

    @Test
    @DisplayName("5. Seeded sessions belong to intended demo users with mathematically coherent metrics")
    void testSeededSessionsBelongToUsersAndAreCoherent() {
        seederService.seedAllDemoData();

        List<String> demoUsernames = List.of("demo_ace", "demo_beginner", "demo_consistent");
        for (String username : demoUsernames) {
            User user = userRepository.findByUsername(username).orElseThrow();
            List<PracticeSession> sessions = practiceSessionRepository.findByUserId(user.getId());

            assertThat(sessions)
                    .as("Demo user %s must have between 20 and 40 practice sessions", username)
                    .hasSizeBetween(20, 40);

            for (PracticeSession s : sessions) {
                assertThat(s.getUser().getId()).isEqualTo(user.getId());
                assertThat(s.getTemplateTitleSnapshot()).isNotBlank();
                assertThat(s.getLanguageSnapshot()).isNotBlank();
                assertThat(s.getDifficultySnapshot()).isNotBlank();
                assertThat(s.getStartedAt()).isNotNull();

                if (s.getStatus() == PracticeSessionStatus.COMPLETED) {
                    assertThat(s.getCompletedAt()).isNotNull();
                    assertThat(s.getCompletedAt()).isAfterOrEqualTo(s.getStartedAt());
                    assertThat(s.getDurationMs()).isGreaterThan(0L);

                    // Check character consistency
                    assertThat(s.getTotalCharacters())
                            .isEqualTo(s.getCorrectCharacters() + s.getIncorrectCharacters());
                    assertThat(s.getErrorCount()).isEqualTo(s.getIncorrectCharacters());

                    // Check accuracy bounds
                    assertThat(s.getAccuracyPercent())
                            .isGreaterThanOrEqualTo(BigDecimal.ZERO)
                            .isLessThanOrEqualTo(BigDecimal.valueOf(100.00));

                    // Gross WPM >= Net WPM
                    assertThat(s.getGrossWpm()).isGreaterThanOrEqualTo(s.getNetWpm());
                    assertThat(s.getNetWpm()).isGreaterThanOrEqualTo(BigDecimal.ZERO);
                } else if (s.getStatus() == PracticeSessionStatus.ABANDONED) {
                    assertThat(s.getCompletedAt()).isNull();
                }
            }
        }
    }

    @Test
    @DisplayName("6. Daily activity aggregates agree exactly with seeded completed session data")
    void testActivityAggregatesAgreeWithSessionData() {
        seederService.seedAllDemoData();

        List<String> demoUsernames = List.of("demo_ace", "demo_beginner", "demo_consistent");
        for (String username : demoUsernames) {
            User user = userRepository.findByUsername(username).orElseThrow();
            List<PracticeSession> completedSessions = practiceSessionRepository.findByUserIdAndStatusOrderByStartedAtDesc(
                    user.getId(), PracticeSessionStatus.COMPLETED
            );
            List<DailyPracticeActivity> activities = dailyPracticeActivityRepository.findByUserId(user.getId());

            assertThat(activities).isNotEmpty();

            // Total session counts across daily records must equal total completed sessions
            int aggregatedSessionCount = activities.stream().mapToInt(DailyPracticeActivity::getSessionCount).sum();
            assertThat(aggregatedSessionCount).isEqualTo(completedSessions.size());

            // Validate day-by-day telemetry parity
            for (DailyPracticeActivity act : activities) {
                LocalDate date = act.getActivityDate();
                List<PracticeSession> daySessions = completedSessions.stream()
                        .filter(s -> s.getStartedAt().atZone(ZoneOffset.UTC).toLocalDate().equals(date))
                        .toList();

                assertThat(daySessions)
                        .as("Daily activity on %s must have corresponding completed sessions", date)
                        .isNotEmpty();

                assertThat(act.getSessionCount()).isEqualTo(daySessions.size());

                long expectedSeconds = daySessions.stream().mapToLong(s -> s.getDurationMs() / 1000).sum();
                assertThat(act.getTotalPracticeSeconds()).isEqualTo(expectedSeconds);

                int expectedCharacters = daySessions.stream().mapToInt(PracticeSession::getTotalCharacters).sum();
                assertThat(act.getTotalCharacters()).isEqualTo(expectedCharacters);
            }
        }
    }

    @Test
    @DisplayName("7. Achievements and SRS cards relationships satisfy database constraints")
    void testAchievementAndSrsConstraints() {
        seederService.seedAllDemoData();

        // Validate achievements
        List<UserAchievement> userAchievements = userAchievementRepository.findAll();
        assertThat(userAchievements).isNotEmpty();

        for (UserAchievement ua : userAchievements) {
            assertThat(ua.getUser()).isNotNull();
            assertThat(ua.getAchievement()).isNotNull();
            assertThat(ua.getUnlockedAt()).isNotNull();
            if (ua.getProgress() != null) {
                assertThat(ua.getProgress()).isGreaterThanOrEqualTo(0);
            }
        }

        // Validate SRS cards
        List<SrsCard> srsCards = srsCardRepository.findAll();
        assertThat(srsCards).isNotEmpty();

        for (SrsCard card : srsCards) {
            assertThat(card.getUser()).isNotNull();
            assertThat(card.getSnippetTitle()).isNotNull();
            assertThat(card.getSnippetId()).isNotNull();
            assertThat(card.getRepetition()).isGreaterThanOrEqualTo(0);
            assertThat(card.getEaseFactor()).isGreaterThanOrEqualTo(BigDecimal.valueOf(1.30));
            assertThat(card.getDueDate()).isNotNull();
        }
    }

    @Test
    @DisplayName("8. Production profile configuration strictly forbids demo data seeding")
    void testProductionProfileBlocksSeeding() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");
        prodEnv.setProperty("devtype.demo-data.enabled", "true");

        DemoDataProperties props = new DemoDataProperties();
        props.setEnabled(true);

        DemoDataSeederService prodSeeder = new DemoDataSeederService(
                userRepository, userPreferencesRepository, practiceTemplateRepository,
                practiceSessionRepository, dailyPracticeActivityRepository,
                achievementRepository, userAchievementRepository,
                srsCardRepository,
                passwordEncoder, props, prodEnv
        );

        assertThatThrownBy(prodSeeder::seedIfEnabled)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CRITICAL SAFETY GUARD");
    }

    @Test
    @DisplayName("9. Existing user data is completely preserved when demo seeder runs")
    void testExistingUserDataPreserved() {
        // Create an existing real/custom user prior to demo seeding
        User standardUser = new User();
        standardUser.setUsername("existing_real_developer");
        standardUser.setEmail("real_dev@company.org");
        standardUser.setPasswordHash(passwordEncoder.encode("RealSecretPassword99!"));
        standardUser.setDisplayName("Existing Real Developer");
        standardUser.setRole(UserRole.USER);
        standardUser.setStatus(UserStatus.ACTIVE);
        standardUser.setAccountType(AccountType.STANDARD);
        standardUser = userRepository.saveAndFlush(standardUser);

        UserPreferences standardPrefs = new UserPreferences(standardUser);
        standardPrefs.setTheme("light");
        standardPrefs.setDefaultLanguage("python");
        standardPrefs.setDefaultDifficulty("BEGINNER");
        userPreferencesRepository.saveAndFlush(standardPrefs);

        // Run demo seeding
        seederService.seedAllDemoData();

        // Verify standard user remains completely unaltered
        User reloadedUser = userRepository.findById(standardUser.getId()).orElseThrow();
        assertThat(reloadedUser.getUsername()).isEqualTo("existing_real_developer");
        assertThat(reloadedUser.getEmail()).isEqualTo("real_dev@company.org");
        assertThat(reloadedUser.getAccountType()).isEqualTo(AccountType.STANDARD);
        assertThat(passwordEncoder.matches("RealSecretPassword99!", reloadedUser.getPasswordHash())).isTrue();

        UserPreferences reloadedPrefs = userPreferencesRepository.findByUserId(reloadedUser.getId()).orElseThrow();
        assertThat(reloadedPrefs.getTheme()).isEqualTo("light");
        assertThat(reloadedPrefs.getDefaultLanguage()).isEqualTo("python");
    }

    @Test
    @DisplayName("10. Seeding when disabled performs no operations and returns false")
    void testSeedingWhenDisabled() {
        MockEnvironment disabledEnv = new MockEnvironment();
        disabledEnv.setActiveProfiles("test");
        disabledEnv.setProperty("devtype.demo-data.enabled", "false");

        DemoDataProperties props = new DemoDataProperties();
        props.setEnabled(false);

        DemoDataSeederService disabledSeeder = new DemoDataSeederService(
                userRepository, userPreferencesRepository, practiceTemplateRepository,
                practiceSessionRepository, dailyPracticeActivityRepository,
                achievementRepository, userAchievementRepository,
                srsCardRepository,
                passwordEncoder, props, disabledEnv
        );

        boolean executed = disabledSeeder.seedIfEnabled();
        assertThat(executed).isFalse();
    }
}
