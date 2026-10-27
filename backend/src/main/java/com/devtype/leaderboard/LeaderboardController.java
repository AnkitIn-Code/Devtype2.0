package com.devtype.leaderboard;

import com.devtype.common.dto.ApiResponse;
import com.devtype.leaderboard.dto.LeaderboardEntryResponse;
import com.devtype.leaderboard.service.LeaderboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST API exposing real platform leaderboard rankings.
 */
@RestController
@RequestMapping("/api/v1/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    /**
     * Retrieves ranked developers based on timeframe and sorting metric.
     *
     * Example: GET /api/v1/leaderboard?timeframe=thisWeek&metric=wpm
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<LeaderboardEntryResponse>>> getLeaderboard(
            @RequestParam(defaultValue = "allTime") String timeframe,
            @RequestParam(defaultValue = "wpm") String metric
    ) {
        List<LeaderboardEntryResponse> entries = leaderboardService.getLeaderboard(timeframe, metric);
        return ResponseEntity.ok(ApiResponse.success(entries, "Leaderboard rankings retrieved successfully"));
    }
}
