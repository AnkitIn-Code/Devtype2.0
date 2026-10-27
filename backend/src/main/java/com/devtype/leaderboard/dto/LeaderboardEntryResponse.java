package com.devtype.leaderboard.dto;

/**
 * Leaderboard ranking projection for platform developers.
 */
public record LeaderboardEntryResponse(
    Long id,
    int rank,
    String name,
    String displayName,
    String avatar,
    String avatarBg,
    int level,
    String title,
    String primaryLang,
    int wpm,
    long xp,
    double accuracy,
    long sessions,
    int streak,
    boolean isCurrentUser,
    boolean isFriend
) {}
