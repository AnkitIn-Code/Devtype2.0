package com.devtype.practice;

import com.devtype.common.entity.CreatedEntity;
import com.devtype.template.PracticeTemplate;
import com.devtype.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Historical practice session recording keystroke telemetry and performance metrics.
 * Uses immutable snapshot attributes to preserve historical accuracy even if the template changes.
 */
@Entity
@Table(name = "practice_sessions")
public class PracticeSession extends CreatedEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private PracticeTemplate template;

    @Column(name = "template_title_snapshot", nullable = false, length = 150)
    private String templateTitleSnapshot;

    @Column(name = "language_snapshot", nullable = false, length = 50)
    private String languageSnapshot;

    @Column(name = "difficulty_snapshot", nullable = false, length = 50)
    private String difficultySnapshot;

    @Column(name = "source_content_snapshot", columnDefinition = "TEXT")
    private String sourceContentSnapshot;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "duration_ms", nullable = false)
    private Long durationMs = 0L;

    @Column(name = "gross_wpm", nullable = false, precision = 6, scale = 2)
    private BigDecimal grossWpm = BigDecimal.ZERO;

    @Column(name = "net_wpm", nullable = false, precision = 6, scale = 2)
    private BigDecimal netWpm = BigDecimal.ZERO;

    @Column(name = "accuracy_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal accuracyPercent = BigDecimal.ZERO;

    @Column(name = "correct_characters", nullable = false)
    private Integer correctCharacters = 0;

    @Column(name = "incorrect_characters", nullable = false)
    private Integer incorrectCharacters = 0;

    @Column(name = "total_characters", nullable = false)
    private Integer totalCharacters = 0;

    @Column(name = "error_count", nullable = false)
    private Integer errorCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private PracticeSessionStatus status = PracticeSessionStatus.IN_PROGRESS;

    public PracticeSession() {
        super();
    }

    public PracticeSession(User user, PracticeTemplate template, String templateTitleSnapshot,
                           String languageSnapshot, String difficultySnapshot, Instant startedAt) {
        this.user = user;
        this.template = template;
        this.templateTitleSnapshot = templateTitleSnapshot;
        this.languageSnapshot = languageSnapshot;
        this.difficultySnapshot = difficultySnapshot;
        this.startedAt = startedAt;
        this.status = PracticeSessionStatus.IN_PROGRESS;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public PracticeTemplate getTemplate() {
        return template;
    }

    public void setTemplate(PracticeTemplate template) {
        this.template = template;
    }

    public String getTemplateTitleSnapshot() {
        return templateTitleSnapshot;
    }

    public void setTemplateTitleSnapshot(String templateTitleSnapshot) {
        this.templateTitleSnapshot = templateTitleSnapshot;
    }

    public String getLanguageSnapshot() {
        return languageSnapshot;
    }

    public void setLanguageSnapshot(String languageSnapshot) {
        this.languageSnapshot = languageSnapshot;
    }

    public String getDifficultySnapshot() {
        return difficultySnapshot;
    }

    public void setDifficultySnapshot(String difficultySnapshot) {
        this.difficultySnapshot = difficultySnapshot;
    }

    public String getSourceContentSnapshot() {
        return sourceContentSnapshot;
    }

    public void setSourceContentSnapshot(String sourceContentSnapshot) {
        this.sourceContentSnapshot = sourceContentSnapshot;
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
}
