package com.devtype.template;

import com.devtype.common.entity.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/**
 * Shared platform template containing coding exercises, algorithms, and syntax drills.
 */
@Entity
@Table(name = "practice_templates")
public class PracticeTemplate extends AuditableEntity {

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "slug", nullable = false, unique = true, length = 150)
    private String slug;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "language", nullable = false, length = 50)
    private String language;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false, length = 30)
    private DifficultyLevel difficulty = DifficultyLevel.INTERMEDIATE;

    @Column(name = "category", nullable = false, length = 100)
    private String category;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "estimated_duration_seconds", nullable = false)
    private Integer estimatedDurationSeconds;

    @Column(name = "is_published", nullable = false)
    private boolean published = true;

    @jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @jakarta.persistence.JoinColumn(name = "author_id")
    private com.devtype.user.User author;

    @Column(name = "is_ai_generated", nullable = false)
    private boolean aiGenerated = false;

    public PracticeTemplate() {
        super();
    }

    public PracticeTemplate(String title, String slug, String language, DifficultyLevel difficulty,
                            String category, String content, Integer estimatedDurationSeconds) {
        this.title = title;
        this.slug = slug;
        this.language = language;
        this.difficulty = difficulty;
        this.category = category;
        this.content = content;
        this.estimatedDurationSeconds = estimatedDurationSeconds;
        this.published = true;
    }

    public PracticeTemplate(String title, String slug, String description, String language, DifficultyLevel difficulty,
                            String category, String content, Integer estimatedDurationSeconds) {
        this(title, slug, language, difficulty, category, content, estimatedDurationSeconds);
        this.description = description;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Integer getEstimatedDurationSeconds() {
        return estimatedDurationSeconds;
    }

    public void setEstimatedDurationSeconds(Integer estimatedDurationSeconds) {
        this.estimatedDurationSeconds = estimatedDurationSeconds;
    }

    public boolean isPublished() {
        return published;
    }

    public void setPublished(boolean published) {
        this.published = published;
    }

    public com.devtype.user.User getAuthor() {
        return author;
    }

    public void setAuthor(com.devtype.user.User author) {
        this.author = author;
    }

    public boolean isAiGenerated() {
        return aiGenerated;
    }

    public void setAiGenerated(boolean aiGenerated) {
        this.aiGenerated = aiGenerated;
    }
}
