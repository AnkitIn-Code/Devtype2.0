package com.devtype.leaderboard.dto;

public record MatchRecordResult(
    UserRankResponse userRank,
    MatchHistoryResponse matchRecord
) {}
