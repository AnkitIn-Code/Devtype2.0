package com.devtype.xp.service;

import com.devtype.xp.dto.UserLevelProgression;
import org.springframework.stereotype.Service;

/**
 * Authoritative mathematical engine governing developer level progression and thresholds.
 * Uses quadratic scaling where each Level L requires:
 * Threshold(L) = 100 * L * (L - 1)
 */
@Service
public class LevelProgressionService {

    public static final int BASE_XP_MULTIPLIER = 100;
    public static final int MAX_SUPPORTED_LEVEL = 100;

    /**
     * Calculates the level progression for a given total XP amount.
     *
     * @param totalXp Total lifetime accumulated experience points
     * @return UserLevelProgression with level, thresholds, and percentage
     */
    public UserLevelProgression calculateProgression(long totalXp) {
        long sanitizedXp = Math.max(0L, totalXp);

        // Level L = 1 + floor((sqrt(1 + 4 * sanitizedXp / 100) - 1) / 2)
        double term = 1.0 + (4.0 * sanitizedXp) / BASE_XP_MULTIPLIER;
        int level = 1 + (int) Math.floor((Math.sqrt(term) - 1.0) / 2.0);
        if (level < 1) {
            level = 1;
        } else if (level > MAX_SUPPORTED_LEVEL) {
            level = MAX_SUPPORTED_LEVEL;
        }

        long currentThreshold = getThresholdForLevel(level);
        long nextThreshold = getThresholdForLevel(level + 1);
        long xpInLevel = sanitizedXp - currentThreshold;
        long spanForNext = nextThreshold - currentThreshold;

        int progressPercent;
        if (spanForNext <= 0 || level >= MAX_SUPPORTED_LEVEL) {
            progressPercent = 100;
        } else {
            progressPercent = (int) Math.min(100, Math.max(0, Math.round((xpInLevel * 100.0) / spanForNext)));
        }

        return new UserLevelProgression(
                level,
                sanitizedXp,
                xpInLevel,
                nextThreshold,
                spanForNext,
                progressPercent
        );
    }

    /**
     * Returns the cumulative lifetime XP required to unlock a specific level.
     */
    public long getThresholdForLevel(int level) {
        if (level <= 1) {
            return 0L;
        }
        long l = level;
        return BASE_XP_MULTIPLIER * (l - 1) * l;
    }
}
