package com.devtype.dashboard.service;

import com.devtype.dashboard.DailyPracticeActivity;
import com.devtype.dashboard.DailyPracticeActivityRepository;
import com.devtype.dashboard.dto.DailyActivityPointResponse;
import com.devtype.user.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Service managing transactional daily activity recording, streak calculations,
 * and activity heatmap telemetry.
 */
@Service
public class DailyPracticeActivityService {

    private static final Logger log = LoggerFactory.getLogger(DailyPracticeActivityService.class);

    private final DailyPracticeActivityRepository dailyPracticeActivityRepository;

    public DailyPracticeActivityService(DailyPracticeActivityRepository dailyPracticeActivityRepository) {
        this.dailyPracticeActivityRepository = dailyPracticeActivityRepository;
    }

    /**
     * Transactionally increments daily practice activity metrics for a completed session.
     * Safely handles concurrent completions and respects unique user-date constraints.
     */
    @Transactional
    public void recordCompletedSession(User user, java.time.Instant completedAt, Long durationMs, Integer characters) {
        if (user == null || completedAt == null) {
            return;
        }

        LocalDate activityDate = completedAt.atZone(ZoneOffset.UTC).toLocalDate();
        long practiceSeconds = Math.max(0L, durationMs != null ? durationMs / 1000 : 0L);
        int characterCount = Math.max(0, characters != null ? characters : 0);

        Optional<DailyPracticeActivity> existingOpt = dailyPracticeActivityRepository
                .findByUserIdAndActivityDate(user.getId(), activityDate);

        if (existingOpt.isPresent()) {
            DailyPracticeActivity activity = existingOpt.get();
            activity.setSessionCount(activity.getSessionCount() + 1);
            activity.setTotalPracticeSeconds(activity.getTotalPracticeSeconds() + practiceSeconds);
            activity.setTotalCharacters(activity.getTotalCharacters() + characterCount);
            dailyPracticeActivityRepository.save(activity);
        } else {
            DailyPracticeActivity newActivity = new DailyPracticeActivity(user, activityDate);
            newActivity.setSessionCount(1);
            newActivity.setTotalPracticeSeconds(practiceSeconds);
            newActivity.setTotalCharacters(characterCount);

            try {
                dailyPracticeActivityRepository.saveAndFlush(newActivity);
            } catch (DataIntegrityViolationException ex) {
                // Recover from race condition when another thread inserted for this user+date simultaneously
                log.debug("Concurrent insertion detected for daily activity, updating existing record: {}", ex.getMessage());
                DailyPracticeActivity concurrentActivity = dailyPracticeActivityRepository
                        .findByUserIdAndActivityDate(user.getId(), activityDate)
                        .orElseThrow(() -> ex);
                concurrentActivity.setSessionCount(concurrentActivity.getSessionCount() + 1);
                concurrentActivity.setTotalPracticeSeconds(concurrentActivity.getTotalPracticeSeconds() + practiceSeconds);
                concurrentActivity.setTotalCharacters(concurrentActivity.getTotalCharacters() + characterCount);
                dailyPracticeActivityRepository.save(concurrentActivity);
            }
        }
    }

    /**
     * Calculates the user's current streak and all-time best streak in days based on UTC activity dates.
     *
     * @return record containing currentStreak and bestStreak.
     */
    @Transactional(readOnly = true)
    public StreakResult calculateStreaks(Long userId) {
        List<DailyPracticeActivity> activities = dailyPracticeActivityRepository
                .findByUserIdOrderByActivityDateAsc(userId);
        return calculateStreaksFromActivities(activities);
    }

    /**
     * Internal helper to compute streaks in memory from a pre-fetched activities list.
     */
    public StreakResult calculateStreaksFromActivities(List<DailyPracticeActivity> activities) {
        if (activities == null || activities.isEmpty()) {
            return new StreakResult(0, 0);
        }

        Set<LocalDate> activeDates = new HashSet<>();
        List<LocalDate> sortedDates = new ArrayList<>();

        for (DailyPracticeActivity act : activities) {
            if (act.getSessionCount() != null && act.getSessionCount() > 0) {
                if (activeDates.add(act.getActivityDate())) {
                    sortedDates.add(act.getActivityDate());
                }
            }
        }

        if (sortedDates.isEmpty()) {
            return new StreakResult(0, 0);
        }

        // Calculate all-time best streak
        int bestStreak = 1;
        int currentConsecutive = 1;

        for (int i = 1; i < sortedDates.size(); i++) {
            LocalDate prev = sortedDates.get(i - 1);
            LocalDate curr = sortedDates.get(i);

            if (curr.equals(prev.plusDays(1))) {
                currentConsecutive++;
                bestStreak = Math.max(bestStreak, currentConsecutive);
            } else {
                currentConsecutive = 1;
            }
        }

        // Calculate current active streak
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate yesterday = today.minusDays(1);

        int currentStreak = 0;
        LocalDate pointer = null;

        if (activeDates.contains(today)) {
            pointer = today;
        } else if (activeDates.contains(yesterday)) {
            // User completed practice yesterday, streak is currently active today
            pointer = yesterday;
        }

        if (pointer != null) {
            while (activeDates.contains(pointer)) {
                currentStreak++;
                pointer = pointer.minusDays(1);
            }
        }

        bestStreak = Math.max(bestStreak, currentStreak);

        return new StreakResult(currentStreak, bestStreak);
    }

    /**
     * Retrieves daily activity heatmap points for the specified year (or past 365 days).
     */
    @Transactional(readOnly = true)
    public List<DailyActivityPointResponse> getHeatmapPoints(Long userId, int year) {
        LocalDate startOfYear = LocalDate.of(year, 1, 1);
        LocalDate endOfYear = LocalDate.of(year, 12, 31);

        List<DailyPracticeActivity> activities = dailyPracticeActivityRepository
                .findByUserIdAndActivityDateBetweenOrderByActivityDateAsc(userId, startOfYear, endOfYear);

        return activities.stream()
                .map(a -> new DailyActivityPointResponse(
                        a.getActivityDate(),
                        a.getSessionCount(),
                        a.getTotalPracticeSeconds(),
                        a.getTotalCharacters()
                ))
                .toList();
    }

    /**
     * Single roundtrip eager fetch retrieving both streaks and heatmap points together.
     */
    @Transactional(readOnly = true)
    public StreakAndHeatmapResult getStreaksAndHeatmap(Long userId, int year) {
        List<DailyPracticeActivity> activities = dailyPracticeActivityRepository
                .findByUserIdOrderByActivityDateAsc(userId);

        StreakResult streaks = calculateStreaksFromActivities(activities);

        LocalDate startOfYear = LocalDate.of(year, 1, 1);
        LocalDate endOfYear = LocalDate.of(year, 12, 31);
        List<DailyActivityPointResponse> heatmap = activities.stream()
                .filter(a -> a.getActivityDate() != null && !a.getActivityDate().isBefore(startOfYear) && !a.getActivityDate().isAfter(endOfYear))
                .map(a -> new DailyActivityPointResponse(
                        a.getActivityDate(),
                        a.getSessionCount(),
                        a.getTotalPracticeSeconds(),
                        a.getTotalCharacters()
                ))
                .toList();

        return new StreakAndHeatmapResult(streaks, heatmap);
    }

    public record StreakResult(int currentStreak, int bestStreak) {
    }

    public record StreakAndHeatmapResult(StreakResult streaks, List<DailyActivityPointResponse> heatmap) {
    }
}
