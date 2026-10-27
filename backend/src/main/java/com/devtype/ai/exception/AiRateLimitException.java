package com.devtype.ai.exception;

import com.devtype.common.exception.ApiException;
import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a user exceeds their allowed AI generation rate limit.
 */
public class AiRateLimitException extends ApiException {

    private final int limitPerHour;
    private final long retryAfterSeconds;

    public AiRateLimitException(String message, int limitPerHour, long retryAfterSeconds) {
        super(message, HttpStatus.TOO_MANY_REQUESTS);
        this.limitPerHour = limitPerHour;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public int getLimitPerHour() {
        return limitPerHour;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
