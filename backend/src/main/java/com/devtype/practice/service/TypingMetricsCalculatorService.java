package com.devtype.practice.service;

import com.devtype.practice.dto.CompletePracticeSessionRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;

/**
 * Reusable backend service for validating keystroke inputs and calculating authoritative
 * typing telemetry (Gross WPM, Net WPM, Accuracy, and durations).
 */
@Service
public class TypingMetricsCalculatorService {

    public static final long MINIMUM_DURATION_MS = 1000L;
    public static final double MAXIMUM_PLAUSIBLE_WPM = 350.0;

    /**
     * Container record for server-calculated typing metrics.
     */
    public record CalculatedMetrics(
            long durationMs,
            BigDecimal grossWpm,
            BigDecimal netWpm,
            BigDecimal accuracyPercent,
            int correctCharacters,
            int incorrectCharacters,
            int totalCharacters,
            int errorCount
    ) {
    }

    /**
     * Calculates and validates typing metrics for a completing practice session.
     *
     * @param startedAt              Server timestamp when the session began.
     * @param completedAt            Server timestamp when the completion was received.
     * @param request                Client-submitted completion metrics and telemetry.
     * @param sourceContentSnapshot  Reference text snippet content.
     * @return Validated, calculated metrics.
     */
    public CalculatedMetrics calculateMetrics(
            Instant startedAt,
            Instant completedAt,
            CompletePracticeSessionRequest request,
            String sourceContentSnapshot
    ) {
        if (startedAt == null || completedAt == null) {
            throw new IllegalArgumentException("Session start and completion timestamps must not be null");
        }

        long serverElapsedMs = Math.max(0L, Duration.between(startedAt, completedAt).toMillis());

        // Validate and bound effective duration
        long durationMs = determineEffectiveDuration(serverElapsedMs, request.getElapsedMs());

        int correctChars = request.getCorrectCharacters() != null ? Math.max(0, request.getCorrectCharacters()) : 0;
        int errorCount = request.getErrorCount() != null ? Math.max(0, request.getErrorCount()) : 0;
        int incorrectChars = request.getIncorrectCharacters() != null
                ? Math.max(0, request.getIncorrectCharacters())
                : errorCount;

        int totalKeystrokes = request.getTotalKeystrokes() != null ? Math.max(0, request.getTotalKeystrokes()) : 0;
        int totalCharacters = Math.max(totalKeystrokes, correctChars + incorrectChars);

        // Sanity check against reference content
        if (sourceContentSnapshot != null && !sourceContentSnapshot.isEmpty()) {
            int refLength = sourceContentSnapshot.length();
            if (correctChars > refLength + 50) {
                throw new IllegalArgumentException(
                        "Submitted correct characters (" + correctChars + ") exceeds template length (" + refLength + ")"
                );
            }

            // Flag impossible typing speeds for non-trivial snippets
            if (refLength >= 40) {
                double minutes = durationMs / 60000.0;
                double calculatedWpm = (correctChars / 5.0) / minutes;
                if (calculatedWpm > MAXIMUM_PLAUSIBLE_WPM) {
                    throw new IllegalArgumentException(
                            "Calculated typing speed (" + Math.round(calculatedWpm) + " WPM) exceeds maximum plausible rate (" + (int) MAXIMUM_PLAUSIBLE_WPM + " WPM)"
                    );
                }
            }
        }

        double minutes = durationMs / 60000.0;
        double calculatedGrossWpm = minutes > 0 ? (totalCharacters / 5.0) / minutes : 0.0;
        double calculatedNetWpm = minutes > 0 ? Math.max(0.0, (correctChars / 5.0) / minutes) : 0.0;

        double calculatedAccuracy = totalCharacters > 0
                ? Math.min(100.0, Math.max(0.0, (correctChars * 100.0) / totalCharacters))
                : 100.0;

        BigDecimal grossWpm = BigDecimal.valueOf(calculatedGrossWpm).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netWpm = BigDecimal.valueOf(calculatedNetWpm).setScale(2, RoundingMode.HALF_UP);
        BigDecimal accuracyPercent = BigDecimal.valueOf(calculatedAccuracy).setScale(2, RoundingMode.HALF_UP);

        return new CalculatedMetrics(
                durationMs,
                grossWpm,
                netWpm,
                accuracyPercent,
                correctChars,
                incorrectChars,
                totalCharacters,
                errorCount
        );
    }

    /**
     * Determines the authoritative elapsed duration in milliseconds.
     * Prefers client duration if provided within a reasonable tolerance of server duration,
     * but always guarantees a minimum threshold and prevents forward clock drift.
     */
    private long determineEffectiveDuration(long serverElapsedMs, Long clientElapsedMs) {
        if (clientElapsedMs == null || clientElapsedMs <= 0) {
            return Math.max(MINIMUM_DURATION_MS, serverElapsedMs);
        }

        // Bound client duration: cannot exceed server elapsed time by more than 5 seconds
        long maxAllowed = serverElapsedMs + 5000L;
        long boundedClient = Math.min(clientElapsedMs, maxAllowed);
        return Math.max(MINIMUM_DURATION_MS, boundedClient);
    }
}
