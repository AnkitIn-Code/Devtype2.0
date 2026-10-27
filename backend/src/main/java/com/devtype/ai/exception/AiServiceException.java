package com.devtype.ai.exception;

import com.devtype.common.exception.ApiException;
import org.springframework.http.HttpStatus;

/**
 * Exception thrown when an error occurs during AI model interaction,
 * such as authentication failures, timeouts, provider outages, or malformed outputs.
 */
public class AiServiceException extends ApiException {

    public AiServiceException(String message) {
        super(message, HttpStatus.SERVICE_UNAVAILABLE);
    }

    public AiServiceException(String message, HttpStatus status) {
        super(message, status);
    }

    public AiServiceException(String message, Throwable cause, HttpStatus status) {
        super(message, cause, status);
    }
}
