package com.devtype.srs.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record SubmitSrsReviewRequest(
        @NotBlank(message = "snippetId is required")
        String snippetId,
        String snippetTitle,
        String language,
        @Min(value = 0, message = "qualityScore must be between 0 and 5")
        @Max(value = 5, message = "qualityScore must be between 0 and 5")
        int qualityScore,
        Integer netWpm,
        Double accuracy,
        Integer errorCount
) {
    public SubmitSrsReviewRequest(
            String snippetId,
            String snippetTitle,
            String language,
            int qualityScore,
            Integer netWpm,
            Double accuracy
    ) {
        this(snippetId, snippetTitle, language, qualityScore, netWpm, accuracy, null);
    }
}
