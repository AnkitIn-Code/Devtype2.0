package com.devtype.dashboard.controller;

import com.devtype.auth.security.SecurityUtils;
import com.devtype.common.dto.ApiResponse;
import com.devtype.dashboard.dto.DashboardSummaryResponse;
import com.devtype.dashboard.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller providing user-specific dashboard aggregates, streaks,
 * recent sessions, and heatmap telemetry.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * Retrieves aggregated dashboard summary metrics for the authenticated user.
     *
     * Example: GET /api/v1/dashboard
     */
    @GetMapping
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getDashboard() {
        Long userId = SecurityUtils.getRequiredCurrentUserId();
        DashboardSummaryResponse response = dashboardService.getDashboardSummary(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
