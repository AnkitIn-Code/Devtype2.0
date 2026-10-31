package com.devtype.srs;

import com.devtype.common.entity.AuditableEntity;
import com.devtype.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Spaced Repetition (SRS) tracking card implementing SM-2 memory retention
 * with speed-based scheduling and permanent mastery tiers.
 */
@Entity
@Table(name = "srs_cards", uniqueConstraints = {
        @UniqueConstraint(name = "uq_srs_user_snippet", columnNames = {"user_id", "snippet_id"})
})
public class SrsCard extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "snippet_id", nullable = false, length = 150)
    private String snippetId;

    @Column(name = "snippet_title", nullable = false, length = 200)
    private String snippetTitle;

    @Column(name = "language", nullable = false, length = 50)
    private String language;

    @Column(name = "repetition", nullable = false)
    private int repetition = 0;

    @Column(name = "ease_factor", nullable = false, precision = 4, scale = 2)
    private BigDecimal easeFactor = new BigDecimal("2.50");

    @Column(name = "interval_days")
    private Integer intervalDays = 1;

    @Column(name = "is_mastered", nullable = false)
    private boolean isMastered = false;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "last_reviewed_at")
    private Instant lastReviewedAt;

    @Column(name = "last_quality_score", nullable = false)
    private int lastQualityScore = 0;

    public SrsCard() {
        super();
    }

    public SrsCard(User user, String snippetId, String snippetTitle, String language,
                   int repetition, BigDecimal easeFactor, Integer intervalDays, Instant dueDate) {
        super();
        this.user = user;
        this.snippetId = snippetId;
        this.snippetTitle = snippetTitle;
        this.language = language;
        this.repetition = repetition;
        this.easeFactor = easeFactor;
        this.intervalDays = intervalDays;
        this.dueDate = dueDate;
        this.isMastered = false;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getSnippetId() {
        return snippetId;
    }

    public void setSnippetId(String snippetId) {
        this.snippetId = snippetId;
    }

    public String getSnippetTitle() {
        return snippetTitle;
    }

    public void setSnippetTitle(String snippetTitle) {
        this.snippetTitle = snippetTitle;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public int getRepetition() {
        return repetition;
    }

    public void setRepetition(int repetition) {
        this.repetition = repetition;
    }

    public BigDecimal getEaseFactor() {
        return easeFactor;
    }

    public void setEaseFactor(BigDecimal easeFactor) {
        this.easeFactor = easeFactor;
    }

    public Integer getIntervalDays() {
        return intervalDays;
    }

    public void setIntervalDays(Integer intervalDays) {
        this.intervalDays = intervalDays;
    }

    public boolean isMastered() {
        return isMastered;
    }

    public void setMastered(boolean mastered) {
        isMastered = mastered;
    }

    public Instant getDueDate() {
        return dueDate;
    }

    public void setDueDate(Instant dueDate) {
        this.dueDate = dueDate;
    }

    public Instant getLastReviewedAt() {
        return lastReviewedAt;
    }

    public void setLastReviewedAt(Instant lastReviewedAt) {
        this.lastReviewedAt = lastReviewedAt;
    }

    public int getLastQualityScore() {
        return lastQualityScore;
    }

    public void setLastQualityScore(int lastQualityScore) {
        this.lastQualityScore = lastQualityScore;
    }
}
