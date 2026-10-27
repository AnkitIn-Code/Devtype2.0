package com.devtype.dashboard;

import com.devtype.common.entity.AuditableEntity;
import com.devtype.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDate;

/**
 * Aggregated daily practice telemetry entity supporting GitHub-style 52-week activity heatmaps.
 */
@Entity
@Table(name = "daily_practice_activity", uniqueConstraints = {
        @UniqueConstraint(name = "uq_daily_activity_user_date", columnNames = {"user_id", "activity_date"})
})
public class DailyPracticeActivity extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @Column(name = "session_count", nullable = false)
    private Integer sessionCount = 0;

    @Column(name = "total_practice_seconds", nullable = false)
    private Long totalPracticeSeconds = 0L;

    @Column(name = "total_characters", nullable = false)
    private Integer totalCharacters = 0;

    public DailyPracticeActivity() {
        super();
    }

    public DailyPracticeActivity(User user, LocalDate activityDate) {
        this.user = user;
        this.activityDate = activityDate;
        this.sessionCount = 0;
        this.totalPracticeSeconds = 0L;
        this.totalCharacters = 0;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDate getActivityDate() {
        return activityDate;
    }

    public void setActivityDate(LocalDate activityDate) {
        this.activityDate = activityDate;
    }

    public Integer getSessionCount() {
        return sessionCount;
    }

    public void setSessionCount(Integer sessionCount) {
        this.sessionCount = sessionCount;
    }

    public Long getTotalPracticeSeconds() {
        return totalPracticeSeconds;
    }

    public void setTotalPracticeSeconds(Long totalPracticeSeconds) {
        this.totalPracticeSeconds = totalPracticeSeconds;
    }

    public Integer getTotalCharacters() {
        return totalCharacters;
    }

    public void setTotalCharacters(Integer totalCharacters) {
        this.totalCharacters = totalCharacters;
    }
}
