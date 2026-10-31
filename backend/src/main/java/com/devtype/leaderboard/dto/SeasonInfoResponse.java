package com.devtype.leaderboard.dto;

import java.time.Instant;

/**
 * Competitive Season metadata and status response.
 */
public record SeasonInfoResponse(
    Integer seasonNumber,
    String seasonName,
    String status,
    Instant startsAt,
    Instant endsAt,
    long daysRemaining,
    long activeCompetitors,
    String lastSeasonChampionName,
    String lastSeasonChampionUsername,
    Integer lastSeasonChampionRating,
    Integer lastSeasonNumber
) {}
