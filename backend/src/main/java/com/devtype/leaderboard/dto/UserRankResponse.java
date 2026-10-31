package com.devtype.leaderboard.dto;

/**
 * Current user rank, BGMI tier progression, and projected next season starting tier.
 */
public record UserRankResponse(
    long rank,
    String tier,
    int rating,
    int peakRating,
    int wins,
    int losses,
    int matchesPlayed,
    int winRate,
    int pointsToNextTier,
    String nextTierName,
    String projectedResetTier,
    int projectedResetRating,
    long daysRemaining,
    Integer seasonNumber,
    String seasonName
) {}
