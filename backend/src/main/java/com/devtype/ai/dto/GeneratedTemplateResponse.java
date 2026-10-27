package com.devtype.ai.dto;

import java.time.Instant;

/**
 * Validated response payload containing the AI-generated practice template
 * and typing telemetry estimates.
 */
public record GeneratedTemplateResponse(
        String id,
        String title,
        String description,
        String language,
        String difficulty,
        String topic,
        String exerciseType,
        String instructions,
        String code,
        int estimatedDurationSeconds,
        int characterCount,
        int lineCount,
        String model,
        int remainingHourlyQuota,
        Instant generatedAt
) {}
