package com.devtype.achievement.service;

import com.devtype.achievement.Achievement;
import com.devtype.achievement.AchievementRepository;
import com.devtype.achievement.UserAchievement;
import com.devtype.achievement.UserAchievementRepository;
import com.devtype.achievement.dto.AchievementResponse;
import com.devtype.srs.SrsCardRepository;
import com.devtype.dashboard.service.DailyPracticeActivityService;
import com.devtype.practice.PracticeSession;
import com.devtype.practice.PracticeSessionRepository;
import com.devtype.practice.PracticeSessionStatus;
import com.devtype.user.User;
import com.devtype.user.UserRepository;
import com.devtype.xp.service.XpService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service managing platform achievement evaluation, milestone unlocks, and user progress tracking.
 */
@Service
public class AchievementService {

    private static final Logger log = LoggerFactory.getLogger(AchievementService.class);

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final PracticeSessionRepository practiceSessionRepository;
    private final SrsCardRepository srsCardRepository;
    private final DailyPracticeActivityService dailyPracticeActivityService;
    private final XpService xpService;
    private final UserRepository userRepository;

    public AchievementService(
            AchievementRepository achievementRepository,
            UserAchievementRepository userAchievementRepository,
            PracticeSessionRepository practiceSessionRepository,
            SrsCardRepository srsCardRepository,
            DailyPracticeActivityService dailyPracticeActivityService,
            XpService xpService,
            UserRepository userRepository) {
        this.achievementRepository = achievementRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.practiceSessionRepository = practiceSessionRepository;
        this.srsCardRepository = srsCardRepository;
        this.dailyPracticeActivityService = dailyPracticeActivityService;
        this.xpService = xpService;
        this.userRepository = userRepository;
    }


    /**
     * Evaluates all applicable achievements after a practice session completes.
     * Unlocks newly reached milestones and awards bonus XP.
     *
     * @param session The newly completed session
     * @return List of newly unlocked achievements in this event
     */
    @Transactional
    public List<AchievementResponse> evaluatePracticeAchievements(PracticeSession session) {
        if (session == null || session.getUser() == null || session.getStatus() != PracticeSessionStatus.COMPLETED) {
            return Collections.emptyList();
        }

        User user = session.getUser();
        Long userId = user.getId();

        long completedSessions = practiceSessionRepository.countByUserIdAndStatus(userId, PracticeSessionStatus.COMPLETED);
        PracticeSessionRepository.SessionPerformanceSummary summary = practiceSessionRepository.getPerformanceSummary(userId, PracticeSessionStatus.COMPLETED);

        BigDecimal bestWpm = summary != null && summary.getBestNetWpm() != null ? summary.getBestNetWpm() : BigDecimal.ZERO;
        BigDecimal highestAccuracy = session.getAccuracyPercent() != null ? session.getAccuracyPercent() : BigDecimal.ZERO;
        long totalChars = summary != null && summary.getTotalCharacters() != null ? summary.getTotalCharacters() : 0L;

        DailyPracticeActivityService.StreakResult streakInfo = dailyPracticeActivityService.calculateStreaks(userId);
        int currentStreak = streakInfo.currentStreak();
        int bestStreak = streakInfo.bestStreak();

        List<AchievementResponse> newlyUnlocked = new ArrayList<>();

        // Sessions Milestones
        checkAndUnlock(user, "first-session", completedSessions >= 1, (int) completedSessions, newlyUnlocked);
        checkAndUnlock(user, "tests-5", completedSessions >= 5, (int) completedSessions, newlyUnlocked);
        checkAndUnlock(user, "tests-10", completedSessions >= 10, (int) completedSessions, newlyUnlocked);
        checkAndUnlock(user, "tests-25", completedSessions >= 25, (int) completedSessions, newlyUnlocked);
        checkAndUnlock(user, "tests-50", completedSessions >= 50, (int) completedSessions, newlyUnlocked);
        checkAndUnlock(user, "tests-100", completedSessions >= 100, (int) completedSessions, newlyUnlocked);
        checkAndUnlock(user, "tests-250", completedSessions >= 250, (int) completedSessions, newlyUnlocked);

        // Character Volume Milestones
        checkAndUnlock(user, "chars-1000", totalChars >= 1000, (int) totalChars, newlyUnlocked);
        checkAndUnlock(user, "chars-5000", totalChars >= 5000, (int) totalChars, newlyUnlocked);
        checkAndUnlock(user, "chars-25000", totalChars >= 25000, (int) totalChars, newlyUnlocked);

        // Speed Milestones
        int bestWpmInt = bestWpm.intValue();
        checkAndUnlock(user, "speed-40", bestWpmInt >= 40, bestWpmInt, newlyUnlocked);
        checkAndUnlock(user, "speed-60", bestWpmInt >= 60, bestWpmInt, newlyUnlocked);
        checkAndUnlock(user, "speed-80", bestWpmInt >= 80, bestWpmInt, newlyUnlocked);
        checkAndUnlock(user, "speed-100", bestWpmInt >= 100, bestWpmInt, newlyUnlocked);
        checkAndUnlock(user, "speed-120", bestWpmInt >= 120, bestWpmInt, newlyUnlocked);
        checkAndUnlock(user, "speed-140", bestWpmInt >= 140, bestWpmInt, newlyUnlocked);

        // Accuracy Milestones
        int accInt = highestAccuracy.intValue();
        checkAndUnlock(user, "accuracy-95", accInt >= 95, accInt, newlyUnlocked);
        checkAndUnlock(user, "accuracy-98", accInt >= 98, accInt, newlyUnlocked);
        checkAndUnlock(user, "accuracy-100", accInt >= 100, accInt, newlyUnlocked);

        // Consistency / Streaks
        int maxStreak = Math.max(currentStreak, bestStreak);
        checkAndUnlock(user, "streak-2", maxStreak >= 2, maxStreak, newlyUnlocked);
        checkAndUnlock(user, "streak-7", maxStreak >= 7, maxStreak, newlyUnlocked);
        checkAndUnlock(user, "streak-14", maxStreak >= 14, maxStreak, newlyUnlocked);
        checkAndUnlock(user, "streak-30", maxStreak >= 30, maxStreak, newlyUnlocked);

        // Polyglot Languages
        long distinctLanguages = practiceSessionRepository.countDistinctLanguagesByUserIdAndStatus(userId, PracticeSessionStatus.COMPLETED);
        checkAndUnlock(user, "lang-polyglot-2", distinctLanguages >= 2, (int) distinctLanguages, newlyUnlocked);
        checkAndUnlock(user, "lang-polyglot-4", distinctLanguages >= 4, (int) distinctLanguages, newlyUnlocked);

        return newlyUnlocked;
    }

    /**
     * Evaluates spaced repetition (SRS) achievements after an active recall review completes.
     */
    @Transactional
    public List<AchievementResponse> evaluateSrsAchievements(User user) {
        if (user == null) {
            return Collections.emptyList();
        }

        long srsReviews = srsCardRepository.countByUserId(user.getId());
        List<AchievementResponse> newlyUnlocked = new ArrayList<>();

        checkAndUnlock(user, "first-srs-review", srsReviews >= 1, (int) srsReviews, newlyUnlocked);
        checkAndUnlock(user, "srs-reviews-5", srsReviews >= 5, (int) srsReviews, newlyUnlocked);
        checkAndUnlock(user, "srs-reviews-15", srsReviews >= 15, (int) srsReviews, newlyUnlocked);

        return newlyUnlocked;
    }


    /**
     * Lists all platform achievements with unlock status and current progress for the user.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<AchievementResponse> getUserAchievements(Long userId) {
        List<Achievement> allAchievements = achievementRepository.findAll();
        Map<Long, UserAchievement> userUnlocks = userAchievementRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(ua -> ua.getAchievement().getId(), ua -> ua, (a, b) -> a));

        // Aggregate current progress values
        long completedSessions = practiceSessionRepository.countByUserIdAndStatus(userId, PracticeSessionStatus.COMPLETED);
        PracticeSessionRepository.SessionPerformanceSummary summary = practiceSessionRepository.getPerformanceSummary(userId, PracticeSessionStatus.COMPLETED);
        BigDecimal bestWpm = summary != null && summary.getBestNetWpm() != null ? summary.getBestNetWpm() : BigDecimal.ZERO;
        BigDecimal bestAccuracy = summary != null && summary.getBestAccuracy() != null ? summary.getBestAccuracy() : BigDecimal.ZERO;
        long totalChars = summary != null && summary.getTotalCharacters() != null ? summary.getTotalCharacters() : 0L;
        long distinctLanguages = practiceSessionRepository.countDistinctLanguagesByUserIdAndStatus(userId, PracticeSessionStatus.COMPLETED);
        DailyPracticeActivityService.StreakResult streakInfo = dailyPracticeActivityService.calculateStreaks(userId);
        int maxStreak = Math.max(streakInfo.currentStreak(), streakInfo.bestStreak());
        long completedChallenges = srsCardRepository.countByUserId(userId);

        User user = null;
        List<AchievementResponse> result = new ArrayList<>();
        for (Achievement ach : allAchievements) {
            UserAchievement ua = userUnlocks.get(ach.getId());
            boolean unlocked = ua != null;
            Instant unlockedAt = ua != null ? ua.getUnlockedAt() : null;

            int currentVal = computeCurrentProgress(ach.getCode(), completedSessions, totalChars, bestWpm.intValue(), bestAccuracy.intValue(), maxStreak, completedChallenges, distinctLanguages);
            int threshold = ach.getThreshold() != null ? ach.getThreshold() : 1;

            // Auto-unlock if user reached threshold but wasn't saved in user_achievements yet
            if (!unlocked && currentVal >= threshold && threshold > 0) {
                if (user == null) {
                    user = userRepository.findById(userId).orElse(null);
                }
                if (user != null) {
                    try {
                        ua = new UserAchievement(user, ach, Instant.now());
                        ua.setProgress(threshold);
                        ua = userAchievementRepository.saveAndFlush(ua);
                        xpService.awardAchievementXp(user, ach);
                        unlocked = true;
                        unlockedAt = ua.getUnlockedAt();
                    } catch (DataIntegrityViolationException ignored) {
                        unlocked = true;
                    }
                }
            }

            int displayProgress = unlocked ? threshold : Math.min(threshold, currentVal);

            result.add(new AchievementResponse(
                    ach.getId(),
                    ach.getCode(),
                    ach.getName(),
                    ach.getDescription(),
                    ach.getIcon(),
                    ach.getCategory(),
                    threshold,
                    XpService.ACHIEVEMENT_DEFAULT_XP,
                    unlocked,
                    unlockedAt,
                    displayProgress,
                    threshold,
                    determineUnit(ach.getCode())
            ));
        }

        return result;
    }

    private void checkAndUnlock(User user, String code, boolean qualified, int currentVal, List<AchievementResponse> newlyUnlocked) {
        if (!qualified) return;

        Optional<Achievement> achOpt = achievementRepository.findByCode(code);
        if (achOpt.isEmpty()) return;

        Achievement ach = achOpt.get();
        if (userAchievementRepository.existsByUserIdAndAchievementId(user.getId(), ach.getId())) {
            return;
        }

        try {
            UserAchievement ua = new UserAchievement(user, ach, Instant.now());
            ua.setProgress(ach.getThreshold() != null ? ach.getThreshold() : currentVal);
            userAchievementRepository.saveAndFlush(ua);

            // Award achievement XP
            xpService.awardAchievementXp(user, ach);

            log.info("Achievement unlocked for user {}: {}", user.getUsername(), ach.getName());
            newlyUnlocked.add(new AchievementResponse(
                    ach.getId(),
                    ach.getCode(),
                    ach.getName(),
                    ach.getDescription(),
                    ach.getIcon(),
                    ach.getCategory(),
                    ach.getThreshold(),
                    XpService.ACHIEVEMENT_DEFAULT_XP,
                    true,
                    ua.getUnlockedAt(),
                    ach.getThreshold(),
                    ach.getThreshold(),
                    determineUnit(ach.getCode())
            ));
        } catch (DataIntegrityViolationException ex) {
            log.warn("Achievement {} already unlocked concurrently for user {}", code, user.getId());
        }
    }

    private int computeCurrentProgress(String code, long completedSessions, long totalChars, int bestWpm, int bestAccuracy, int maxStreak, long completedChallenges, long distinctLanguages) {
        if (code.startsWith("speed-")) {
            return bestWpm;
        }
        if (code.startsWith("chars-")) {
            return (int) totalChars;
        }
        if (code.startsWith("accuracy-")) {
            return bestAccuracy;
        }
        if (code.startsWith("streak-")) {
            return maxStreak;
        }
        if (code.startsWith("srs-") || "first-srs-review".equals(code) || code.startsWith("challenges-") || "first-challenge".equals(code)) {
            return (int) completedChallenges;
        }
        if (code.startsWith("lang-polyglot-")) {
            return (int) distinctLanguages;
        }
        if (code.startsWith("tests-") || "first-session".equals(code)) {
            return (int) completedSessions;
        }
        return (int) completedSessions;
    }

    private String determineUnit(String code) {
        if (code.startsWith("speed-")) return "WPM";
        if (code.startsWith("chars-")) return "Chars";
        if (code.startsWith("streak-")) return "Days";
        if (code.startsWith("accuracy-")) return "%";
        if (code.startsWith("lang-polyglot-")) return "Languages";
        if (code.contains("srs") || code.contains("challenge")) return "Reviews";
        return "Runs";
    }
}

