package com.devtype.snippet.dto;

import com.devtype.snippet.Snippet;

import java.time.Instant;
import java.util.List;

public record SnippetSummaryResponse(
        Long id,
        String title,
        String slug,
        String language,
        String category,
        String subCategory,
        String difficulty,
        String description,
        String code,
        List<String> tags,
        boolean isCurated,
        boolean isCustom,
        int xpBounty,
        Long createdByUserId,
        Instant createdAt
) {
    public static SnippetSummaryResponse fromEntity(Snippet s) {
        return new SnippetSummaryResponse(
                s.getId(),
                s.getTitle(),
                s.getSlug(),
                s.getLanguage(),
                s.getCategory(),
                s.getSubCategory(),
                s.getDifficulty(),
                s.getDescription(),
                s.getCode(),
                s.getTagsList(),
                s.isCurated(),
                s.isCustom(),
                s.getXpBounty(),
                s.getCreatedByUserId(),
                s.getCreatedAt()
        );
    }
}
