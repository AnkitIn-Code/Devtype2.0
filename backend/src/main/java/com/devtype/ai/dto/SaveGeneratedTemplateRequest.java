package com.devtype.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Payload for saving an AI-generated template to the authenticated user's personal collection.
 */
public record SaveGeneratedTemplateRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title cannot exceed 150 characters")
        String title,

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        String description,

        @NotBlank(message = "Language is required")
        @Size(max = 50, message = "Language cannot exceed 50 characters")
        String language,

        @NotBlank(message = "Difficulty is required")
        String difficulty,

        @Size(max = 100, message = "Category cannot exceed 100 characters")
        String category,

        @NotBlank(message = "Code content is required")
        @Size(max = 5000, message = "Code content cannot exceed 5000 characters")
        String content,

        @NotNull(message = "Estimated duration is required")
        @Positive(message = "Duration must be positive")
        Integer estimatedDurationSeconds
) {}
