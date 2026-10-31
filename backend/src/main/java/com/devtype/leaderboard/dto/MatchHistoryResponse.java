package com.devtype.leaderboard.dto;

import java.util.List;

public record MatchHistoryResponse(
    String id,
    String mode,
    String date,
    String snippetTitle,
    String language,
    int place,
    int totalPlayers,
    int wpm,
    double accuracy,
    int xpEarned,
    List<String> opponents,
    boolean isWin,
    int ratingDelta,
    int newRating
) {}
