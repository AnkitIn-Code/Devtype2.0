package com.devtype.xp.dto;

/**
 * Representation of a developer's current rank, total experience, and milestone progress.
 */
public record UserLevelProgression(
        int currentLevel,
        long totalXp,
        long currentLevelXp,
        long nextLevelThresholdXp,
        long xpRequiredForNextLevel,
        int progressPercent
) {}
