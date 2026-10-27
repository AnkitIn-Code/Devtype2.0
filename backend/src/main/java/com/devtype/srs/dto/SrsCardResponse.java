package com.devtype.srs.dto;

import com.devtype.srs.SrsCard;

import java.math.BigDecimal;
import java.time.Instant;

public record SrsCardResponse(
        Long id,
        String snippetId,
        String snippetTitle,
        String language,
        int repetition,
        BigDecimal easeFactor,
        int intervalDays,
        Instant dueDate,
        Instant lastReviewedAt,
        int lastQualityScore,
        boolean isDue
) {
    public static SrsCardResponse fromEntity(SrsCard card) {
        boolean due = card.getDueDate() == null || card.getDueDate().isBefore(Instant.now());
        return new SrsCardResponse(
                card.getId(),
                card.getSnippetId(),
                card.getSnippetTitle(),
                card.getLanguage(),
                card.getRepetition(),
                card.getEaseFactor(),
                card.getIntervalDays(),
                card.getDueDate(),
                card.getLastReviewedAt(),
                card.getLastQualityScore(),
                due
        );
    }
}
