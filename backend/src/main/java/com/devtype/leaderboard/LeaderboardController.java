package com.devtype.leaderboard;

import com.devtype.auth.security.SecurityUtils;
import com.devtype.common.dto.ApiResponse;
import com.devtype.leaderboard.dto.LeaderboardEntryResponse;
import com.devtype.leaderboard.dto.MatchHistoryResponse;
import com.devtype.leaderboard.dto.MatchRecordResult;
import com.devtype.leaderboard.dto.RecordRankedMatchRequest;
import com.devtype.leaderboard.dto.SeasonInfoResponse;
import com.devtype.leaderboard.dto.UserRankResponse;
import com.devtype.leaderboard.service.LeaderboardService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST API exposing authoritative competitive leaderboard rankings,
 * active season state, BGMI tier progression, and season rollover.
 */
@RestController
@RequestMapping("/api/v1/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final com.devtype.leaderboard.service.BgmiTierService tiers;

    public LeaderboardController(LeaderboardService leaderboardService, com.devtype.leaderboard.service.BgmiTierService tiers) {
        this.leaderboardService = leaderboardService; this.tiers=tiers;
    }

    /**
     * Retrieves ranked competitors from the database for the active season.
     * Supports filtering by BGMI tier group (e.g. 'Crown', 'Diamond', 'Platinum', 'all').
     */
    @GetMapping("/tiers")
    public Object tiers() { return tiers.configuration(); }

    @GetMapping
    public ResponseEntity<ApiResponse<List<LeaderboardEntryResponse>>> getLeaderboard(
            @RequestParam(defaultValue = "all") String tier
    ) {
        List<LeaderboardEntryResponse> entries = leaderboardService.getLeaderboard(tier);
        return ResponseEntity.ok(ApiResponse.success(entries, "Leaderboard rankings retrieved successfully from database"));
    }

    /**
     * Retrieves active season metadata, days remaining, active competitors count,
     * and last season's champion.
     */
    @GetMapping("/season")
    public ResponseEntity<ApiResponse<SeasonInfoResponse>> getSeasonInfo() {
        SeasonInfoResponse info = leaderboardService.getSeasonInfo();
        return ResponseEntity.ok(ApiResponse.success(info, "Season information retrieved successfully"));
    }

    /**
     * Retrieves current authenticated user's rank, BGMI tier progress, and next season reset preview.
     */
    @GetMapping("/my-rank")
    public ResponseEntity<ApiResponse<UserRankResponse>> getUserRank() {
        UserRankResponse rank = leaderboardService.getUserRank();
        return ResponseEntity.ok(ApiResponse.success(rank, "User rank and tier details retrieved successfully"));
    }

    /**
     * Compatibility endpoint: client-authored results are rejected.
     * MultiplayerService alone finalizes persisted matches.
     */
    @PostMapping("/record-match")
    public ResponseEntity<ApiResponse<MatchRecordResult>> recordMatch(
            @RequestBody @Valid RecordRankedMatchRequest request
    ) {
        Long userId = SecurityUtils.getRequiredCurrentUserId();
        MatchRecordResult result = leaderboardService.recordMatch(userId, request);
        return ResponseEntity.ok(ApiResponse.success(result, "Ranked match recorded successfully"));
    }

    /**
     * Retrieves recent matches for the authenticated user from the PostgreSQL database.
     * Newly created accounts will strictly receive an empty list [].
     */
    @GetMapping("/matches/me")
    public ResponseEntity<ApiResponse<List<MatchHistoryResponse>>> getMyMatches() {
        Long userId = SecurityUtils.getRequiredCurrentUserId();
        List<MatchHistoryResponse> matches = leaderboardService.getUserMatchHistory(userId);
        return ResponseEntity.ok(ApiResponse.success(matches, "User match history retrieved successfully"));
    }

    /**
     * Triggers season rollover and BGMI tier reset. Restricted to ADMIN users.
     */
    @PostMapping("/rollover-season")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SeasonInfoResponse>> rolloverSeason() {
        SeasonInfoResponse nextSeason = leaderboardService.endSeasonAndResetTiers();
        return ResponseEntity.ok(ApiResponse.success(nextSeason, "Season ended and tier reset executed successfully"));
    }
}
