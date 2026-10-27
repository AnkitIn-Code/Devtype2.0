package com.devtype.ai.service;

import com.devtype.ai.config.FireworksProperties;
import com.devtype.ai.dto.AiQuotaResponse;
import com.devtype.ai.exception.AiRateLimitException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe sliding window rate limiter controlling per-user AI template generation requests.
 * Protects platform resources and bounds operational LLM inference costs.
 */
@Service
public class AiRateLimiterService {

    private final FireworksProperties properties;
    private final Map<Long, List<Instant>> userRequestTimestamps = new ConcurrentHashMap<>();

    public AiRateLimiterService(FireworksProperties properties) {
        this.properties = properties;
    }

    /**
     * Checks whether the user is within their generation quota and records an access timestamp.
     * Throws AiRateLimitException if the limit is exceeded.
     */
    public synchronized void consumeQuota(Long userId) {
        int limit = properties.getRateLimitPerHour();
        Instant now = Instant.now();
        Instant oneHourAgo = now.minusSeconds(3600);

        List<Instant> timestamps = userRequestTimestamps.computeIfAbsent(
                userId,
                k -> Collections.synchronizedList(new ArrayList<>())
        );

        // Remove entries older than 1 hour
        timestamps.removeIf(t -> t.isBefore(oneHourAgo));

        if (timestamps.size() >= limit) {
            Instant oldestInWindow = timestamps.get(0);
            long secondsUntilReset = Math.max(1, 3600 - (now.getEpochSecond() - oldestInWindow.getEpochSecond()));
            long minutesUntilReset = (long) Math.ceil((double) secondsUntilReset / 60);

            throw new AiRateLimitException(
                    "Hourly AI template generation limit reached (" + limit + " requests/hour). Please try again in "
                            + minutesUntilReset + " minute" + (minutesUntilReset > 1 ? "s" : "") + ".",
                    limit,
                    secondsUntilReset
            );
        }

        timestamps.add(now);
    }

    /**
     * Retrieves the remaining quota statistics for a user without consuming an attempt.
     */
    public AiQuotaResponse getQuota(Long userId) {
        int limit = properties.getRateLimitPerHour();
        Instant now = Instant.now();
        Instant oneHourAgo = now.minusSeconds(3600);

        List<Instant> timestamps = userRequestTimestamps.get(userId);
        if (timestamps == null || timestamps.isEmpty()) {
            return new AiQuotaResponse(limit, 0, limit, 0);
        }

        // Clean up expired entries
        timestamps.removeIf(t -> t.isBefore(oneHourAgo));

        int used = timestamps.size();
        int remaining = Math.max(0, limit - used);
        long resetsInSeconds = 0;
        if (!timestamps.isEmpty()) {
            Instant oldest = timestamps.get(0);
            resetsInSeconds = Math.max(0, 3600 - (now.getEpochSecond() - oldest.getEpochSecond()));
        }

        return new AiQuotaResponse(limit, used, remaining, resetsInSeconds);
    }

    /**
     * For testing: resets the rate limiter state.
     */
    public void reset() {
        userRequestTimestamps.clear();
    }
}
