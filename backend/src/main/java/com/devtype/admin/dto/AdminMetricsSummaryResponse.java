package com.devtype.admin.dto;

import java.time.Instant;

/**
 * Server-calculated administrative performance metrics and system health summary.
 * Provides live operational statistics derived strictly from Micrometer and JVM runtime meters.
 */
public record AdminMetricsSummaryResponse(
        SystemHealthInfo system,
        JvmMemoryInfo memory,
        JvmThreadInfo threads,
        HttpPerformanceInfo http,
        DatabasePoolInfo database,
        AuthMetricsInfo auth,
        String observationWindow,
        Instant timestamp
) {
    public record SystemHealthInfo(
            String status,
            String databaseStatus,
            long uptimeSeconds,
            String uptimeFormatted,
            Instant startTime
    ) {}

    public record JvmMemoryInfo(
            long heapUsedBytes,
            long heapMaxBytes,
            long heapCommittedBytes,
            double heapUtilizationPercent,
            long nonHeapUsedBytes,
            double gcPauseTimeMs
    ) {}

    public record JvmThreadInfo(
            int liveThreads,
            int peakThreads,
            int daemonThreads
    ) {}

    public record HttpPerformanceInfo(
            long totalRequests,
            long errorCount4xx,
            long errorCount5xx,
            double errorRatePercent,
            double meanLatencyMs,
            double maxLatencyMs,
            Double p50LatencyMs,
            Double p95LatencyMs,
            Double p99LatencyMs,
            double throughputPerMinute
    ) {}

    public record DatabasePoolInfo(
            int activeConnections,
            int idleConnections,
            int pendingConnections,
            int maxConnections,
            double poolUtilizationPercent
    ) {}

    public record AuthMetricsInfo(
            long successfulLogins,
            long failedLogins
    ) {}
}
