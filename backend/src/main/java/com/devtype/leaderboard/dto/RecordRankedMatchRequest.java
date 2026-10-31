package com.devtype.leaderboard.dto;

import jakarta.validation.constraints.NotNull;

public record RecordRankedMatchRequest(
    @NotNull Boolean isWin,
    String mode,
    Integer opponentRating,
    String opponentName,
    Integer userWpm,
    Double userAccuracy,
    String snippetTitle,
    String language,
    Long durationSeconds,
    Integer place,
    Integer totalPlayers
) {}
