package com.devtype.admin.service;

import com.devtype.admin.dto.AdminMetricsSummaryResponse;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.distribution.ValueAtPercentile;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.ThreadMXBean;
import java.sql.Connection;
import java.time.Instant;
import java.util.Collection;
import java.util.concurrent.TimeUnit;

/**
 * Service aggregating server runtime performance indicators and Micrometer metrics
 * for administrative platform monitoring.
 */
@Service
public class AdminMonitoringService {

    private final MeterRegistry meterRegistry;
    private final DataSource dataSource;

    public AdminMonitoringService(MeterRegistry meterRegistry, DataSource dataSource) {
        this.meterRegistry = meterRegistry;
        this.dataSource = dataSource;
    }

    public AdminMetricsSummaryResponse getMetricsSummary() {
        Instant now = Instant.now();

        // 1. System & Health
        boolean dbUp;
        try (Connection conn = dataSource.getConnection()) {
            dbUp = conn.isValid(2);
        } catch (Exception e) {
            dbUp = false;
        }

        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
        long uptimeSeconds = uptimeMs / 1000;
        Instant startTime = Instant.ofEpochMilli(ManagementFactory.getRuntimeMXBean().getStartTime());
        String systemStatus = dbUp ? "UP" : "DEGRADED";
        String databaseStatus = dbUp ? "UP" : "DOWN";

        // 2. JVM Memory
        Runtime rt = Runtime.getRuntime();
        long heapTotal = rt.totalMemory();
        long heapFree = rt.freeMemory();
        long heapUsed = heapTotal - heapFree;
        long heapMax = rt.maxMemory();
        double heapUtilPercent = heapMax > 0 ? ((double) heapUsed / heapMax) * 100.0 : 0.0;

        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        long nonHeapUsed = memoryBean.getNonHeapMemoryUsage().getUsed();

        double gcPauseTimeMs = 0.0;
        Collection<Timer> gcTimers = meterRegistry.find("jvm.gc.pause").timers();
        for (Timer t : gcTimers) {
            gcPauseTimeMs += t.totalTime(TimeUnit.MILLISECONDS);
        }

        // 3. JVM Threads
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        int liveThreads = threadBean.getThreadCount();
        int peakThreads = threadBean.getPeakThreadCount();
        int daemonThreads = threadBean.getDaemonThreadCount();

        // 4. HTTP Performance & Latency
        Collection<Timer> httpTimers = meterRegistry.find("http.server.requests").timers();
        long totalRequests = 0;
        long error4xx = 0;
        long error5xx = 0;
        double totalDurationMs = 0.0;
        double maxLatencyMs = 0.0;
        Double p50LatencyMs = null;
        Double p95LatencyMs = null;
        Double p99LatencyMs = null;

        for (Timer t : httpTimers) {
            totalRequests += t.count();
            totalDurationMs += t.totalTime(TimeUnit.MILLISECONDS);
            maxLatencyMs = Math.max(maxLatencyMs, t.max(TimeUnit.MILLISECONDS));

            String statusTag = t.getId().getTag("status");
            if (statusTag != null) {
                if (statusTag.startsWith("4")) {
                    error4xx += t.count();
                } else if (statusTag.startsWith("5")) {
                    error5xx += t.count();
                }
            }

            var snapshot = t.takeSnapshot();
            for (ValueAtPercentile vap : snapshot.percentileValues()) {
                if (Math.abs(vap.percentile() - 0.5) < 0.01 && p50LatencyMs == null) {
                    p50LatencyMs = vap.value(TimeUnit.MILLISECONDS);
                } else if (Math.abs(vap.percentile() - 0.95) < 0.01 && p95LatencyMs == null) {
                    p95LatencyMs = vap.value(TimeUnit.MILLISECONDS);
                } else if (Math.abs(vap.percentile() - 0.99) < 0.01 && p99LatencyMs == null) {
                    p99LatencyMs = vap.value(TimeUnit.MILLISECONDS);
                }
            }
        }

        double meanLatencyMs = totalRequests > 0 ? totalDurationMs / totalRequests : 0.0;
        double errorRatePercent = totalRequests > 0 ? ((double) (error4xx + error5xx) / totalRequests) * 100.0 : 0.0;
        double throughputPerMin = uptimeSeconds > 0 ? ((double) totalRequests / uptimeSeconds) * 60.0 : 0.0;

        // 5. Database Connection Pool (HikariCP)
        int activeConnections = (int) getGaugeValue("hikaricp.connections.active");
        int idleConnections = (int) getGaugeValue("hikaricp.connections.idle");
        int pendingConnections = (int) getGaugeValue("hikaricp.connections.pending");
        int maxConnections = (int) getGaugeValue("hikaricp.connections.max");
        if (maxConnections <= 0) {
            maxConnections = 10; // Default pool size fallback
        }
        double poolUtilPercent = maxConnections > 0 ? ((double) activeConnections / maxConnections) * 100.0 : 0.0;

        // 6. Authentication Telemetry
        long successfulLogins = (long) getCounterValue("devtype.auth.attempts", "outcome", "success");
        long failedLogins = (long) getCounterValueTotal("devtype.auth.attempts", "outcome", "failure");

        return new AdminMetricsSummaryResponse(
                new AdminMetricsSummaryResponse.SystemHealthInfo(
                        systemStatus,
                        databaseStatus,
                        uptimeSeconds,
                        formatUptime(uptimeSeconds),
                        startTime
                ),
                new AdminMetricsSummaryResponse.JvmMemoryInfo(
                        heapUsed,
                        heapMax,
                        heapTotal,
                        heapUtilPercent,
                        nonHeapUsed,
                        gcPauseTimeMs
                ),
                new AdminMetricsSummaryResponse.JvmThreadInfo(
                        liveThreads,
                        peakThreads,
                        daemonThreads
                ),
                new AdminMetricsSummaryResponse.HttpPerformanceInfo(
                        totalRequests,
                        error4xx,
                        error5xx,
                        errorRatePercent,
                        meanLatencyMs,
                        maxLatencyMs,
                        p50LatencyMs,
                        p95LatencyMs,
                        p99LatencyMs,
                        throughputPerMin
                ),
                new AdminMetricsSummaryResponse.DatabasePoolInfo(
                        activeConnections,
                        idleConnections,
                        pendingConnections,
                        maxConnections,
                        poolUtilPercent
                ),
                new AdminMetricsSummaryResponse.AuthMetricsInfo(
                        successfulLogins,
                        failedLogins
                ),
                "cumulative_process_lifetime",
                now
        );
    }

    private double getGaugeValue(String meterName) {
        var meter = meterRegistry.find(meterName).gauge();
        return meter != null ? meter.value() : 0.0;
    }

    private double getCounterValue(String meterName, String tagKey, String tagValue) {
        var meter = meterRegistry.find(meterName).tag(tagKey, tagValue).counter();
        return meter != null ? meter.count() : 0.0;
    }

    private double getCounterValueTotal(String meterName, String tagKey, String tagValue) {
        return meterRegistry.find(meterName).tag(tagKey, tagValue).counters()
                .stream()
                .mapToDouble(Counter::count)
                .sum();
    }

    private String formatUptime(long seconds) {
        long days = seconds / 86400;
        long hours = (seconds % 86400) / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;

        if (days > 0) {
            return String.format("%dd %dh %dm", days, hours, minutes);
        }
        if (hours > 0) {
            return String.format("%dh %dm %ds", hours, minutes, secs);
        }
        if (minutes > 0) {
            return String.format("%dm %ds", minutes, secs);
        }
        return String.format("%ds", secs);
    }
}
