package com.devtype.snippet.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CreateSnippetRequest(
        @NotBlank(message = "Title is required")
        String title,
        @NotBlank(message = "Language is required")
        String language,
        String category,
        String subCategory,
        String difficulty,
        @NotBlank(message = "Code is required")
        String code,
        String description,
        List<String> tags,
        Boolean isPublic,
        Integer xpBounty
) {}
