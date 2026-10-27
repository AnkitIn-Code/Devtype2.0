package com.devtype.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when an incoming request contains invalid parameters or violates business rules (HTTP 400).
 */
public class BadRequestException extends ApiException {

    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
