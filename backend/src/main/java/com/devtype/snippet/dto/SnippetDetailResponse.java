package com.devtype.snippet.dto;

import com.devtype.snippet.Snippet;

import java.time.Instant;
import java.util.List;

public record SnippetDetailResponse(
        Long id,
        String title,
        String slug,
        String language,
        String category,
        String subCategory,
        String difficulty,
        String code,
        String description,
        List<String> tags,
        boolean isCurated,
        boolean isCustom,
        int xpBounty,
        Long createdByUserId,
        Instant createdAt,
        Instant updatedAt
) {
    public static SnippetDetailResponse fromEntity(Snippet s) {
        return new SnippetDetailResponse(
                s.getId(),
                s.getTitle(),
                s.getSlug(),
                s.getLanguage(),
                s.getCategory(),
                s.getSubCategory(),
                s.getDifficulty(),
                s.getCode(),
                s.getDescription(),
                s.getTagsList(),
                s.isCurated(),
                s.isCustom(),
                s.getXpBounty(),
                s.getCreatedByUserId(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
