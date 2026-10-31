package com.devtype.leaderboard.dto;

/**
 * Competitive Leaderboard entry reflecting authoritative database records.
 */
public record LeaderboardEntryResponse(
    Long userId,
    int rank,
    String name,
    String username,
    String avatar,
    String avatarBg,
    int rating,
    String seasonTier,
    int peakRating,
    int wins,
    int losses,
    int matchesPlayed,
    int winRate,
    boolean isCurrentUser,
    Integer lastMatchPoints
) {}
