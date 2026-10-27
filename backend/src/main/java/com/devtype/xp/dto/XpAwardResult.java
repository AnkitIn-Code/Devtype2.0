package com.devtype.xp.dto;

/**
 * Result returned upon an experience points award transaction.
 */
public record XpAwardResult(
        int xpEarned,
        long totalXp,
        int currentLevel,
        long nextLevelThresholdXp,
        int levelProgressPercent,
        boolean newlyAwarded
) {}
