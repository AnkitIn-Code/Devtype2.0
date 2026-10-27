package com.devtype.template.dto;

import com.devtype.template.DifficultyLevel;
import com.devtype.template.PracticeTemplate;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * Summary DTO returned when listing published practice templates.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PracticeTemplateSummaryResponse {

    private Long id;
    private String slug;
    private String title;
    private String description;
    private String language;
    private DifficultyLevel difficulty;
    private String category;
    private Integer estimatedDurationSeconds;
    private int characterCount;
    private int lineCount;
    private String code; // Full code or snippet preview for UI cards
    private boolean aiGenerated;
    private Long authorId;
    private String authorUsername;
    private Instant createdAt;
    private Instant updatedAt;

    public PracticeTemplateSummaryResponse() {
    }

    public static PracticeTemplateSummaryResponse from(PracticeTemplate entity) {
        String content = entity.getContent() != null ? entity.getContent() : "";
        int chars = content.length();
        int lines = content.isEmpty() ? 0 : content.split("\r\n|\r|\n", -1).length;

        PracticeTemplateSummaryResponse dto = new PracticeTemplateSummaryResponse();
        dto.id = entity.getId();
        dto.slug = entity.getSlug();
        dto.title = entity.getTitle();
        dto.description = entity.getDescription();
        dto.language = entity.getLanguage();
        dto.difficulty = entity.getDifficulty();
        dto.category = entity.getCategory();
        dto.estimatedDurationSeconds = entity.getEstimatedDurationSeconds();
        dto.characterCount = chars;
        dto.lineCount = lines;
        dto.code = content;
        dto.aiGenerated = entity.isAiGenerated();
        if (entity.getAuthor() != null) {
            dto.authorId = entity.getAuthor().getId();
            dto.authorUsername = entity.getAuthor().getUsername();
        }
        dto.createdAt = entity.getCreatedAt();
        dto.updatedAt = entity.getUpdatedAt();
        return dto;
    }

    public boolean isAiGenerated() {
        return aiGenerated;
    }

    public void setAiGenerated(boolean aiGenerated) {
        this.aiGenerated = aiGenerated;
    }

    public Long getAuthorId() {
        return authorId;
    }

    public void setAuthorId(Long authorId) {
        this.authorId = authorId;
    }

    public String getAuthorUsername() {
        return authorUsername;
    }

    public void setAuthorUsername(String authorUsername) {
        this.authorUsername = authorUsername;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public DifficultyLevel getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(DifficultyLevel difficulty) {
        this.difficulty = difficulty;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getEstimatedDurationSeconds() {
        return estimatedDurationSeconds;
    }

    public void setEstimatedDurationSeconds(Integer estimatedDurationSeconds) {
        this.estimatedDurationSeconds = estimatedDurationSeconds;
    }

    public int getCharacterCount() {
        return characterCount;
    }

    public void setCharacterCount(int characterCount) {
        this.characterCount = characterCount;
    }

    public int getLineCount() {
        return lineCount;
    }

    public void setLineCount(int lineCount) {
        this.lineCount = lineCount;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
