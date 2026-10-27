package com.devtype.ai.dto;

/**
 * Information regarding the user's remaining AI generation allowance.
 */
public record AiQuotaResponse(
        int hourlyLimit,
        int usedInLastHour,
        int remainingInLastHour,
        long resetsInSeconds
) {}
