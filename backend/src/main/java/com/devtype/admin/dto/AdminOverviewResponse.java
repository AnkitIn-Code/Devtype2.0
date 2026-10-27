package com.devtype.admin.dto;

import java.util.Map;

/**
 * Server-calculated platform overview statistics for administrative dashboard.
 */
public record AdminOverviewResponse(
        long totalUsers,
        long activeUsers,
        long suspendedUsers,
        long deactivatedUsers,
        long standardUsers,
        long demoUsers,
        long newUsersLast7Days,
        long newUsersLast30Days,
        long totalPracticeSessions,
        long totalPracticeDurationMs,
        long totalPracticeDurationSeconds,
        long totalChallengeAttempts,
        Map<String, Long> reportsByStatus,
        long totalReports,
        long openReports,
        long pendingReviewReports
) {}
