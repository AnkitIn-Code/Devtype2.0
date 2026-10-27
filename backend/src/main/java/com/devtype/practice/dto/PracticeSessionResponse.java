package com.devtype.practice.dto;

import com.devtype.practice.PracticeSession;
import com.devtype.practice.PracticeSessionStatus;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Projection DTO representing practice session state, metadata, and typing performance metrics.
 */
public class PracticeSessionResponse {

    private Long id;
    private Long templateId;
    private String templateSlug;
    private String templateTitle;
    private String language;
    private String difficulty;
    private String sourceContent;
    private Instant startedAt;
    private Instant completedAt;
    private Long durationMs;
    private BigDecimal grossWpm;
    private BigDecimal netWpm;
    private BigDecimal accuracyPercent;
    private Integer correctCharacters;
    private Integer incorrectCharacters;
    private Integer totalCharacters;
    private Integer errorCount;
    private PracticeSessionStatus status;

    private Integer xpEarned;
    private Long totalXp;
    private Integer currentLevel;
    private Long nextLevelXp;
    private Integer levelProgressPercent;
    private java.util.List<com.devtype.achievement.dto.AchievementResponse> newlyUnlockedAchievements = new java.util.ArrayList<>();

    public PracticeSessionResponse() {
    }

    public static PracticeSessionResponse fromEntity(PracticeSession session) {
        if (session == null) {
            return null;
        }

        PracticeSessionResponse dto = new PracticeSessionResponse();
        dto.setId(session.getId());
        if (session.getTemplate() != null) {
            dto.setTemplateId(session.getTemplate().getId());
            dto.setTemplateSlug(session.getTemplate().getSlug());
        }
        dto.setTemplateTitle(session.getTemplateTitleSnapshot());
        dto.setLanguage(session.getLanguageSnapshot());
        dto.setDifficulty(session.getDifficultySnapshot());
        dto.setSourceContent(session.getSourceContentSnapshot());
        dto.setStartedAt(session.getStartedAt());
        dto.setCompletedAt(session.getCompletedAt());
        dto.setDurationMs(session.getDurationMs());
        dto.setGrossWpm(session.getGrossWpm());
        dto.setNetWpm(session.getNetWpm());
        dto.setAccuracyPercent(session.getAccuracyPercent());
        dto.setCorrectCharacters(session.getCorrectCharacters());
        dto.setIncorrectCharacters(session.getIncorrectCharacters());
        dto.setTotalCharacters(session.getTotalCharacters());
        dto.setErrorCount(session.getErrorCount());
        dto.setStatus(session.getStatus());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public String getTemplateSlug() {
        return templateSlug;
    }

    public void setTemplateSlug(String templateSlug) {
        this.templateSlug = templateSlug;
    }

    public String getTemplateTitle() {
        return templateTitle;
    }

    public void setTemplateTitle(String templateTitle) {
        this.templateTitle = templateTitle;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public String getSourceContent() {
        return sourceContent;
    }

    public void setSourceContent(String sourceContent) {
        this.sourceContent = sourceContent;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public Long getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(Long durationMs) {
        this.durationMs = durationMs;
    }

    public BigDecimal getGrossWpm() {
        return grossWpm;
    }

    public void setGrossWpm(BigDecimal grossWpm) {
        this.grossWpm = grossWpm;
    }

    public BigDecimal getNetWpm() {
        return netWpm;
    }

    public void setNetWpm(BigDecimal netWpm) {
        this.netWpm = netWpm;
    }

    public BigDecimal getAccuracyPercent() {
        return accuracyPercent;
    }

    public void setAccuracyPercent(BigDecimal accuracyPercent) {
        this.accuracyPercent = accuracyPercent;
    }

    public Integer getCorrectCharacters() {
        return correctCharacters;
    }

    public void setCorrectCharacters(Integer correctCharacters) {
        this.correctCharacters = correctCharacters;
    }

    public Integer getIncorrectCharacters() {
        return incorrectCharacters;
    }

    public void setIncorrectCharacters(Integer incorrectCharacters) {
        this.incorrectCharacters = incorrectCharacters;
    }

    public Integer getTotalCharacters() {
        return totalCharacters;
    }

    public void setTotalCharacters(Integer totalCharacters) {
        this.totalCharacters = totalCharacters;
    }

    public Integer getErrorCount() {
        return errorCount;
    }

    public void setErrorCount(Integer errorCount) {
        this.errorCount = errorCount;
    }

    public PracticeSessionStatus getStatus() {
        return status;
    }

    public void setStatus(PracticeSessionStatus status) {
        this.status = status;
    }

    public Integer getXpEarned() {
        return xpEarned;
    }

    public void setXpEarned(Integer xpEarned) {
        this.xpEarned = xpEarned;
    }

    public Long getTotalXp() {
        return totalXp;
    }

    public void setTotalXp(Long totalXp) {
        this.totalXp = totalXp;
    }

    public Integer getCurrentLevel() {
        return currentLevel;
    }

    public void setCurrentLevel(Integer currentLevel) {
        this.currentLevel = currentLevel;
    }

    public Long getNextLevelXp() {
        return nextLevelXp;
    }

    public void setNextLevelXp(Long nextLevelXp) {
        this.nextLevelXp = nextLevelXp;
    }

    public Integer getLevelProgressPercent() {
        return levelProgressPercent;
    }

    public void setLevelProgressPercent(Integer levelProgressPercent) {
        this.levelProgressPercent = levelProgressPercent;
    }

    public java.util.List<com.devtype.achievement.dto.AchievementResponse> getNewlyUnlockedAchievements() {
        return newlyUnlockedAchievements;
    }

    public void setNewlyUnlockedAchievements(java.util.List<com.devtype.achievement.dto.AchievementResponse> newlyUnlockedAchievements) {
        this.newlyUnlockedAchievements = newlyUnlockedAchievements != null ? newlyUnlockedAchievements : new java.util.ArrayList<>();
    }
}
