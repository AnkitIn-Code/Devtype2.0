package com.devtype.achievement.dto;

import java.time.Instant;

/**
 * Accolade badge model containing progression and unlock status for a specific user.
 */
public record AchievementResponse(
        Long id,
        String code,
        String name,
        String description,
        String icon,
        String category,
        Integer threshold,
        Integer rewardXp,
        boolean unlocked,
        Instant unlockedAt,
        Integer progress,
        Integer maxProgress,
        String unit
) {}
