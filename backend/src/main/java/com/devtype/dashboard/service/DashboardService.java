package com.devtype.dashboard.service;

import com.devtype.achievement.dto.AchievementResponse;
import com.devtype.achievement.service.AchievementService;
import com.devtype.srs.SrsCardRepository;
import com.devtype.dashboard.dto.DailyActivityPointResponse;
import com.devtype.dashboard.dto.DashboardSummaryResponse;
import com.devtype.practice.PracticeSession;
import com.devtype.practice.PracticeSessionRepository;
import com.devtype.practice.PracticeSessionStatus;
import com.devtype.practice.dto.PracticeSessionResponse;
import com.devtype.user.User;
import com.devtype.user.UserRepository;
import com.devtype.xp.dto.UserLevelProgression;
import com.devtype.xp.service.LevelProgressionService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

/**
 * Service aggregating user dashboard statistics, historical speed averages,
 * streaks, recent sessions, heatmap activity data, and XP/achievement progression.
 */
@Service
public class DashboardService {

    private final PracticeSessionRepository practiceSessionRepository;
    private final DailyPracticeActivityService dailyPracticeActivityService;
    private final UserRepository userRepository;
    private final LevelProgressionService levelProgressionService;
    private final SrsCardRepository srsCardRepository;
    private final AchievementService achievementService;

    public DashboardService(
            PracticeSessionRepository practiceSessionRepository,
            DailyPracticeActivityService dailyPracticeActivityService,
            UserRepository userRepository,
            LevelProgressionService levelProgressionService,
            SrsCardRepository srsCardRepository,
            AchievementService achievementService
    ) {
        this.practiceSessionRepository = practiceSessionRepository;
        this.dailyPracticeActivityService = dailyPracticeActivityService;
        this.userRepository = userRepository;
        this.levelProgressionService = levelProgressionService;
        this.srsCardRepository = srsCardRepository;
        this.achievementService = achievementService;
    }

    /**
     * Builds the comprehensive dashboard telemetry summary for the authenticated user.
     */
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary(Long userId) {
        DashboardSummaryResponse response = new DashboardSummaryResponse();

        // 1. Aggregated statistics from completed sessions
        PracticeSessionRepository.SessionPerformanceSummary summary = practiceSessionRepository
                .getPerformanceSummary(userId, PracticeSessionStatus.COMPLETED);

        if (summary != null) {
            response.setTotalCompletedSessions(summary.getTotalSessions() != null ? summary.getTotalSessions() : 0L);

            Double avgWpm = summary.getAvgNetWpm();
            response.setAverageWpm(avgWpm != null
                    ? BigDecimal.valueOf(avgWpm).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO);

            BigDecimal bestWpm = summary.getBestNetWpm();
            response.setBestWpm(bestWpm != null ? bestWpm : BigDecimal.ZERO);

            Double avgAcc = summary.getAvgAccuracy();
            response.setAverageAccuracy(avgAcc != null
                    ? BigDecimal.valueOf(avgAcc).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO);

            Long durationMs = summary.getTotalDurationMs();
            response.setTotalPracticeTimeSeconds(durationMs != null ? durationMs / 1000L : 0L);

            Long totalChars = summary.getTotalCharacters();
            response.setTotalCharactersTyped(totalChars != null ? totalChars : 0L);
        }

        // 2. Streaks calculation
        DailyPracticeActivityService.StreakResult streaks = dailyPracticeActivityService.calculateStreaks(userId);
        response.setCurrentStreak(streaks.currentStreak());
        response.setBestStreak(streaks.bestStreak());

        // 3. 5 most recent completed sessions
        List<PracticeSession> recentEntities = practiceSessionRepository
                .findByUserIdAndStatusOrderByStartedAtDesc(userId, PracticeSessionStatus.COMPLETED, PageRequest.of(0, 5));

        List<PracticeSessionResponse> recentDtos = recentEntities.stream()
                .map(PracticeSessionResponse::fromEntity)
                .toList();
        response.setRecentSessions(recentDtos);

        // 4. Daily activity points for the current year's heatmap
        int currentYear = LocalDate.now(ZoneOffset.UTC).getYear();
        List<DailyActivityPointResponse> heatmapPoints = dailyPracticeActivityService.getHeatmapPoints(userId, currentYear);
        response.setDailyActivity(heatmapPoints);

        // 5. XP and Level Progression
        User user = userRepository.findById(userId).orElse(null);
        long totalXp = user != null ? user.getTotalXp() : 0L;
        UserLevelProgression prog = levelProgressionService.calculateProgression(totalXp);
        response.setTotalXp(prog.totalXp());
        response.setLevel(prog.currentLevel());
        response.setNextLevelXp(prog.nextLevelThresholdXp());
        response.setLevelProgressPercent(prog.progressPercent());

        // 6. Spaced Repetition (SRS) telemetry
        long srsDue = srsCardRepository.countDueCardsByUserId(userId, Instant.now());
        long srsTotal = srsCardRepository.countByUserId(userId);
        response.setSrsDueCardsCount(srsDue);
        response.setSrsTotalCardsCount(srsTotal);
        response.setCompletedChallengesCount(0L);

        // 7. Achievements summary
        List<AchievementResponse> achievements = achievementService.getUserAchievements(userId);
        response.setTotalAchievementsCount(achievements.size());
        response.setUnlockedAchievementsCount((int) achievements.stream().filter(AchievementResponse::unlocked).count());
        response.setRecentAchievements(achievements.stream().filter(AchievementResponse::unlocked).limit(6).toList());

        return response;
    }
}
