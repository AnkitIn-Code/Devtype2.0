package com.devtype.demo;

import com.devtype.achievement.Achievement;
import com.devtype.achievement.AchievementRepository;
import com.devtype.achievement.UserAchievement;
import com.devtype.achievement.UserAchievementRepository;
import com.devtype.dashboard.DailyPracticeActivity;
import com.devtype.dashboard.DailyPracticeActivityRepository;
import com.devtype.practice.PracticeSession;
import com.devtype.practice.PracticeSessionRepository;
import com.devtype.practice.PracticeSessionStatus;
import com.devtype.srs.SrsCard;
import com.devtype.srs.SrsCardRepository;
import com.devtype.template.PracticeTemplate;
import com.devtype.template.PracticeTemplateRepository;
import com.devtype.user.AccountType;
import com.devtype.user.User;
import com.devtype.user.UserPreferences;
import com.devtype.user.UserPreferencesRepository;
import com.devtype.user.UserRepository;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service managing safe, idempotent seeding of realistic multi-language templates,
 * achievements, SRS cards, and demo users.
 */
@Service
public class DemoDataSeederService {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeederService.class);

    private final UserRepository userRepository;
    private final UserPreferencesRepository userPreferencesRepository;
    private final PracticeTemplateRepository practiceTemplateRepository;
    private final PracticeSessionRepository practiceSessionRepository;
    private final DailyPracticeActivityRepository dailyPracticeActivityRepository;
    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final SrsCardRepository srsCardRepository;
    private final PasswordEncoder passwordEncoder;
    private final DemoDataProperties demoDataProperties;
    private final Environment environment;

    public DemoDataSeederService(
            UserRepository userRepository,
            UserPreferencesRepository userPreferencesRepository,
            PracticeTemplateRepository practiceTemplateRepository,
            PracticeSessionRepository practiceSessionRepository,
            DailyPracticeActivityRepository dailyPracticeActivityRepository,
            AchievementRepository achievementRepository,
            UserAchievementRepository userAchievementRepository,
            SrsCardRepository srsCardRepository,
            PasswordEncoder passwordEncoder,
            DemoDataProperties demoDataProperties,
            Environment environment) {
        this.userRepository = userRepository;
        this.userPreferencesRepository = userPreferencesRepository;
        this.practiceTemplateRepository = practiceTemplateRepository;
        this.practiceSessionRepository = practiceSessionRepository;
        this.dailyPracticeActivityRepository = dailyPracticeActivityRepository;
        this.achievementRepository = achievementRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.srsCardRepository = srsCardRepository;
        this.passwordEncoder = passwordEncoder;
        this.demoDataProperties = demoDataProperties;
        this.environment = environment;
    }

    public boolean seedIfEnabled() {
        if (isProductionProfileActive()) {
            if (isSeedingRequested()) {
                log.error("CRITICAL SAFETY GUARD: Demo data seeding was requested while running under production profile! Refusing execution to prevent database pollution.");
                throw new IllegalStateException("CRITICAL SAFETY GUARD: Demo data seeding cannot be executed in production profile.");
            }
            log.debug("Production profile active; demo seeding is strictly disabled.");
            return false;
        }

        if (!isSeedingRequested()) {
            log.info("Demo data seeding is disabled (devtype.demo-data.enabled=false). Skipping demo seed.");
            return false;
        }

        log.info("Demo data seeding is ENABLED. Initializing safe, idempotent demo data population...");
        DemoSeedReport report = seedAllDemoData();
        log.info("Demo data seeding completed successfully: {} users created ({} skipped), {} templates created ({} skipped), {} achievements created, {} srs cards created, {} sessions created, {} daily activity records created, {} user achievements unlocked.",
                report.usersCreated(), report.usersSkipped(),
                report.templatesCreated(), report.templatesSkipped(),
                report.achievementsCreated(),
                report.srsCardsCreated(),
                report.sessionsCreated(),
                report.activityRecordsCreated(),
                report.userAchievementsCreated());
        return true;
    }

    public boolean isProductionProfileActive() {
        String[] activeProfiles = environment.getActiveProfiles();
        for (String profile : activeProfiles) {
            if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                return true;
            }
        }
        return false;
    }

    public boolean isSeedingRequested() {
        Boolean appProp = environment.getProperty("app.demo-data.enabled", Boolean.class);
        if (appProp != null) {
            return appProp;
        }
        Boolean devtypeProp = environment.getProperty("devtype.demo-data.enabled", Boolean.class);
        if (devtypeProp != null) {
            return devtypeProp;
        }
        return demoDataProperties.isEnabled();
    }

    @Transactional
    public DemoSeedReport seedAllDemoData() {
        int templatesCreated = 0;
        int templatesSkipped = 0;
        int achievementsCreated = 0;
        int achievementsSkipped = 0;
        int srsCardsCreated = 0;
        int srsCardsSkipped = 0;
        int usersCreated = 0;
        int usersSkipped = 0;
        int sessionsCreated = 0;
        int activityRecordsCreated = 0;
        int userAchievementsCreated = 0;

        // 1. Seed Predefined 50+ Multi-Language Practice Templates
        List<PracticeTemplate> templateCatalog = PredefinedTemplateCatalog.getAllTemplates();
        for (PracticeTemplate tpl : templateCatalog) {
            if (practiceTemplateRepository.existsBySlug(tpl.getSlug())) {
                templatesSkipped++;
            } else {
                practiceTemplateRepository.save(tpl);
                templatesCreated++;
            }
        }
        practiceTemplateRepository.flush();

        // 2. Seed Shared Achievements
        List<Achievement> achievementCatalog = getPredefinedAchievements();
        for (Achievement ach : achievementCatalog) {
            if (achievementRepository.existsByCode(ach.getCode())) {
                achievementsSkipped++;
            } else {
                achievementRepository.save(ach);
                achievementsCreated++;
            }
        }
        achievementRepository.flush();

        List<PracticeTemplate> allTemplates = practiceTemplateRepository.findAll();
        Map<String, Achievement> achievementMap = achievementRepository.findAll().stream()
                .collect(Collectors.toMap(Achievement::getCode, a -> a));

        // 3. Seed Demo Users
        String demoPassword = demoDataProperties.getDefaultPassword();
        if (demoPassword == null || demoPassword.isBlank()) {
            demoPassword = "DemoPassword123!";
        }
        String passwordHash = passwordEncoder.encode(demoPassword);

        List<DemoUserDefinition> userDefs = List.of(
                new DemoUserDefinition("demo_ace", "demo_ace@example.com", "Alex Mercer (Ace)", "dark", "cpp", "ADVANCED", 45, 2),
                new DemoUserDefinition("demo_consistent", "demo_consistent@example.com", "Jordan Lee (Consistent)", "dark", "python", "INTERMEDIATE", 90, 8),
                new DemoUserDefinition("demo_beginner", "demo_beginner@example.com", "Sam Patel (Novice)", "dark", "javascript", "BEGINNER", 14, 24)
        );

        for (DemoUserDefinition def : userDefs) {
            User user;
            if (userRepository.existsByUsername(def.username)) {
                usersSkipped++;
                user = userRepository.findByUsername(def.username).orElseThrow();
            } else {
                Instant createdAt = Instant.now().minus(def.createdDaysAgo, ChronoUnit.DAYS);
                user = new User(def.username, def.email, passwordHash, def.displayName);
                user.setRole(UserRole.USER);
                user.setStatus(UserStatus.ACTIVE);
                user.setAccountType(AccountType.DEMO);
                user.setCreatedAt(createdAt);
                user.setLastLoginAt(Instant.now().minus(def.lastLoginHoursAgo, ChronoUnit.HOURS));
                user.setAvatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=" + def.username);
                user = userRepository.save(user);

                UserPreferences prefs = new UserPreferences(user);
                prefs.setTheme(def.theme);
                prefs.setDefaultLanguage(def.defaultLanguage);
                prefs.setDefaultDifficulty(def.defaultDifficulty);
                prefs.setCreatedAt(createdAt);
                userPreferencesRepository.save(prefs);
                usersCreated++;
            }

            // 4. Seed Practice Sessions
            List<PracticeSession> userSessions = generateSessionsForUser(user, def.username, allTemplates);
            for (PracticeSession s : userSessions) {
                if (s.getId() == null) {
                    practiceSessionRepository.save(s);
                    sessionsCreated++;
                }
            }
            practiceSessionRepository.flush();

            // 5. Seed Daily Activity
            activityRecordsCreated += seedDailyActivity(user, userSessions);

            // 6. Seed Achievements for Demo User
            userAchievementsCreated += seedUserAchievements(user, def.username, achievementMap, userSessions);

            // 7. Seed SRS Recall Cards for Demo User
            srsCardsCreated += seedSrsCards(user);

            // 8. Synchronize lifetime XP for demo user
            if (user.getTotalXp() == null || user.getTotalXp() == 0L) {
                long calculatedXp = 0L;
                for (PracticeSession s : userSessions) {
                    if (s.getStatus() == PracticeSessionStatus.COMPLETED) {
                        calculatedXp += 50L;
                        String d = s.getDifficultySnapshot() != null ? s.getDifficultySnapshot().toUpperCase() : "";
                        if (d.contains("INTERMEDIATE")) calculatedXp += 25L;
                        else if (d.contains("ADVANCED")) calculatedXp += 50L;
                        if (s.getAccuracyPercent() != null && s.getAccuracyPercent().compareTo(BigDecimal.valueOf(98)) >= 0) {
                            calculatedXp += 25L;
                        }
                    }
                }
                long achCount = userAchievementRepository.countByUserId(user.getId());
                calculatedXp += achCount * 50L;
                long srsCount = srsCardRepository.countByUserId(user.getId());
                calculatedXp += srsCount * 50L;

                user.setTotalXp(calculatedXp);
                userRepository.save(user);
            }
        }

        return new DemoSeedReport(
                usersCreated, usersSkipped,
                templatesCreated, templatesSkipped,
                achievementsCreated, achievementsSkipped,
                srsCardsCreated, srsCardsSkipped,
                sessionsCreated, activityRecordsCreated,
                userAchievementsCreated
        );
    }

    private List<PracticeSession> generateSessionsForUser(
            User user, String username, List<PracticeTemplate> templates) {
        if (templates.isEmpty()) {
            return Collections.emptyList();
        }

        List<PracticeSession> existing = practiceSessionRepository.findByUserId(user.getId());
        if (!existing.isEmpty()) {
            return existing;
        }

        List<PracticeSession> sessions = new ArrayList<>();
        Instant now = Instant.now();
        int count = "demo_ace".equals(username) ? 30 : ("demo_consistent".equals(username) ? 26 : 22);

        for (int i = 0; i < count; i++) {
            PracticeTemplate t = templates.get(i % templates.size());
            Instant startedAt = now.minus(i + 1, ChronoUnit.DAYS).plus((i * 47) % 360, ChronoUnit.MINUTES);
            long durationMs = 45000L + (i * 1000L);
            double gross;
            double accuracy;
            int errors;

            if ("demo_ace".equals(username)) {
                gross = 110.0 + (i % 15);
                accuracy = 98.0 + ((i % 20) * 0.08);
                errors = (i % 3);
            } else if ("demo_consistent".equals(username)) {
                gross = 74.0 + (i % 10);
                accuracy = 96.0 + ((i % 30) * 0.1);
                errors = 1 + (i % 4);
            } else {
                gross = 42.0 + (i % 8);
                accuracy = 92.0 + ((i % 50) * 0.1);
                errors = 2 + (i % 6);
            }

            double net = Math.max(0.0, gross - (errors * 1.5));
            int totalChars = (int) Math.round((gross * 5.0 * durationMs) / 60000.0);
            int incorrectChars = errors;
            int correctChars = totalChars - incorrectChars;

            sessions.add(createSession(
                    user, t, startedAt, durationMs,
                    gross, net, Math.min(100.0, accuracy),
                    correctChars, incorrectChars, totalChars, errors
            ));
        }

        return sessions;
    }

    private PracticeSession createSession(
            User user, PracticeTemplate template, Instant startedAt, long durationMs,
            double grossWpm, double netWpm, double accuracy,
            int correctChars, int incorrectChars, int totalChars, int errors) {
        PracticeSession s = new PracticeSession(user, template, template.getTitle(), template.getLanguage(), template.getDifficulty().name(), startedAt);
        s.setCompletedAt(startedAt.plusMillis(durationMs));
        s.setDurationMs(durationMs);
        s.setGrossWpm(BigDecimal.valueOf(grossWpm).setScale(2, RoundingMode.HALF_UP));
        s.setNetWpm(BigDecimal.valueOf(netWpm).setScale(2, RoundingMode.HALF_UP));
        s.setAccuracyPercent(BigDecimal.valueOf(accuracy).setScale(2, RoundingMode.HALF_UP));
        s.setCorrectCharacters(correctChars);
        s.setIncorrectCharacters(incorrectChars);
        s.setTotalCharacters(totalChars);
        s.setErrorCount(errors);
        s.setStatus(PracticeSessionStatus.COMPLETED);
        return s;
    }

    private int seedDailyActivity(User user, List<PracticeSession> sessions) {
        int count = 0;
        Map<LocalDate, List<PracticeSession>> byDate = sessions.stream()
                .filter(s -> s.getCompletedAt() != null)
                .collect(Collectors.groupingBy(s -> LocalDate.ofInstant(s.getCompletedAt(), ZoneOffset.UTC)));

        for (Map.Entry<LocalDate, List<PracticeSession>> entry : byDate.entrySet()) {
            LocalDate date = entry.getKey();
            if (dailyPracticeActivityRepository.findByUserIdAndActivityDate(user.getId(), date).isEmpty()) {
                List<PracticeSession> list = entry.getValue();
                long totalSecs = list.stream().mapToLong(s -> s.getDurationMs() / 1000).sum();
                int totalChars = list.stream().mapToInt(PracticeSession::getTotalCharacters).sum();
                DailyPracticeActivity act = new DailyPracticeActivity(user, date);
                act.setSessionCount(list.size());
                act.setTotalPracticeSeconds(totalSecs);
                act.setTotalCharacters(totalChars);
                dailyPracticeActivityRepository.save(act);
                count++;
            }
        }
        dailyPracticeActivityRepository.flush();
        return count;
    }

    private int seedUserAchievements(
            User user, String username, Map<String, Achievement> catalog, List<PracticeSession> sessions) {
        int created = 0;
        List<String> codes = switch (username) {
            case "demo_ace" -> List.of("first-session", "tests-5", "speed-40", "speed-60", "speed-80", "speed-100", "accuracy-98", "first-srs-review");
            case "demo_consistent" -> List.of("first-session", "tests-5", "speed-40", "speed-60", "streak-7", "first-srs-review");
            default -> List.of("first-session", "speed-40");
        };

        Instant now = Instant.now();
        for (String code : codes) {
            Achievement ach = catalog.get(code);
            if (ach != null && userAchievementRepository.findByUserIdAndAchievementId(user.getId(), ach.getId()).isEmpty()) {
                UserAchievement ua = new UserAchievement(user, ach, now.minus(5, ChronoUnit.DAYS));
                ua.setProgress(ach.getThreshold());
                userAchievementRepository.save(ua);
                created++;
            }
        }
        userAchievementRepository.flush();
        return created;
    }

    private int seedSrsCards(User user) {
        int created = 0;
        Instant now = Instant.now();

        List<SrsCard> initialCards = List.of(
                new SrsCard(user, "binary-search-cpp", "Binary Search", "cpp", 0, new BigDecimal("2.50"), 1, now.minus(2, ChronoUnit.HOURS)),
                new SrsCard(user, "two-sum-cpp", "Two Sum", "cpp", 1, new BigDecimal("2.60"), 6, now.minus(1, ChronoUnit.HOURS)),
                new SrsCard(user, "lru-cache-cpp", "LRU Cache", "cpp", 2, new BigDecimal("2.50"), 15, now.plus(2, ChronoUnit.DAYS)),
                new SrsCard(user, "react-use-effect", "React useEffect Hook", "javascript", 0, new BigDecimal("2.50"), 1, now.minus(30, ChronoUnit.MINUTES))
        );

        for (SrsCard c : initialCards) {
            if (srsCardRepository.findByUserIdAndSnippetId(user.getId(), c.getSnippetId()).isEmpty()) {
                srsCardRepository.save(c);
                created++;
            }
        }
        srsCardRepository.flush();
        return created;
    }

    private List<Achievement> getPredefinedAchievements() {
        return List.of(
                new Achievement("first-session", "First Keystrokes", "Complete your very first code typing practice session.", "Play", "Volume", 1),
                new Achievement("tests-5", "Code Explorer", "Complete 5 practice sessions across any languages.", "Play", "Volume", 5),
                new Achievement("tests-10", "First Commits", "Complete 10 typing sessions across any languages.", "Play", "Volume", 10),
                new Achievement("tests-25", "Dedicated Practitioner", "Log 25 completed code practice sessions.", "FileCode", "Volume", 25),
                new Achievement("chars-1000", "Code Kilobyte", "Type over 1,000 characters in verified practice sessions.", "Code", "Characters", 1000),
                new Achievement("chars-5000", "Source Code Crafter", "Type over 5,000 total code characters.", "Terminal", "Characters", 5000),
                new Achievement("speed-40", "Typing Apprentice", "Reach a typing speed of 40 WPM on any standard code snippet.", "Zap", "Speed", 40),
                new Achievement("speed-60", "Baseline Velocity", "Reach a typing speed of 60 WPM on any standard code snippet.", "Zap", "Speed", 60),
                new Achievement("speed-80", "Swift Syntax", "Surpass 80 WPM on an intermediate algorithmic problem.", "Zap", "Speed", 80),
                new Achievement("speed-100", "Centurion Velocity", "Hit triple digits: Achieve 100 WPM on any verified practice run.", "Zap", "Speed", 100),
                new Achievement("accuracy-98", "High Precision", "Complete a practice session with 98% or higher accuracy.", "Target", "Accuracy", 98),
                new Achievement("streak-7", "Weekly Habit", "Maintain a 7-day practice streak.", "Flame", "Streak", 7),
                new Achievement("streak-14", "Fortnight Focus", "Maintain a 14-day consecutive practice streak.", "Flame", "Streak", 14),
                new Achievement("first-srs-review", "Synaptic Initiator", "Complete your first spaced repetition active recall review.", "Brain", "SRS", 1),
                new Achievement("srs-reviews-5", "Recall Master", "Complete 5 spaced repetition active recall reviews.", "Trophy", "SRS", 5)
        );
    }

    private record DemoUserDefinition(
            String username,
            String email,
            String displayName,
            String theme,
            String defaultLanguage,
            String defaultDifficulty,
            long createdDaysAgo,
            long lastLoginHoursAgo
    ) {}
}
