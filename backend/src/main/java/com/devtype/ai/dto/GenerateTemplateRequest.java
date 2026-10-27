package com.devtype.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Client request payload for generating an AI-powered code typing template.
 */
public record GenerateTemplateRequest(
        @NotBlank(message = "Programming language is required")
        @Size(max = 50, message = "Language must not exceed 50 characters")
        String language,

        @NotBlank(message = "Difficulty level is required (BEGINNER, INTERMEDIATE, ADVANCED)")
        String difficulty,

        @NotBlank(message = "Topic is required")
        @Size(max = 100, message = "Topic must not exceed 100 characters")
        String topic,

        @Size(max = 50, message = "Exercise type must not exceed 50 characters")
        String exerciseType,

        @Size(max = 50, message = "Target length must not exceed 50 characters")
        String targetLength,

        @Size(max = 500, message = "Custom instructions cannot exceed 500 characters")
        String customInstructions
) {
    public String getSanitizedExerciseType() {
        return (exerciseType != null && !exerciseType.isBlank()) ? exerciseType.trim() : "Algorithm";
    }

    public String getSanitizedTargetLength() {
        return (targetLength != null && !targetLength.isBlank()) ? targetLength.trim() : "Balanced (20-35 lines)";
    }
}
