package com.devtype.dashboard.dto;

import com.devtype.practice.dto.PracticeSessionResponse;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Aggregated dashboard summary providing high-level developer telemetry,
 * streaks, historical averages, recent sessions, and heatmap activity data.
 */
public class DashboardSummaryResponse {

    private Long totalCompletedSessions = 0L;
    private BigDecimal averageWpm = BigDecimal.ZERO;
    private BigDecimal bestWpm = BigDecimal.ZERO;
    private BigDecimal averageAccuracy = BigDecimal.ZERO;
    private Long totalPracticeTimeSeconds = 0L;
    private Long totalCharactersTyped = 0L;
    private Integer currentStreak = 0;
    private Integer bestStreak = 0;
    private List<PracticeSessionResponse> recentSessions = new ArrayList<>();
    private List<DailyActivityPointResponse> dailyActivity = new ArrayList<>();

    private Long totalXp = 0L;
    private Integer level = 1;
    private Long nextLevelXp = 200L;
    private Integer levelProgressPercent = 0;
    private Long completedChallengesCount = 0L;
    private Long srsDueCardsCount = 0L;
    private Long srsTotalCardsCount = 0L;
    private Integer unlockedAchievementsCount = 0;
    private Integer totalAchievementsCount = 0;
    private List<com.devtype.achievement.dto.AchievementResponse> recentAchievements = new ArrayList<>();

    public DashboardSummaryResponse() {
    }

    public Long getTotalCompletedSessions() {
        return totalCompletedSessions;
    }

    public void setTotalCompletedSessions(Long totalCompletedSessions) {
        this.totalCompletedSessions = totalCompletedSessions;
    }

    public BigDecimal getAverageWpm() {
        return averageWpm;
    }

    public void setAverageWpm(BigDecimal averageWpm) {
        this.averageWpm = averageWpm;
    }

    public BigDecimal getBestWpm() {
        return bestWpm;
    }

    public void setBestWpm(BigDecimal bestWpm) {
        this.bestWpm = bestWpm;
    }

    public BigDecimal getAverageAccuracy() {
        return averageAccuracy;
    }

    public void setAverageAccuracy(BigDecimal averageAccuracy) {
        this.averageAccuracy = averageAccuracy;
    }

    public Long getTotalPracticeTimeSeconds() {
        return totalPracticeTimeSeconds;
    }

    public void setTotalPracticeTimeSeconds(Long totalPracticeTimeSeconds) {
        this.totalPracticeTimeSeconds = totalPracticeTimeSeconds;
    }

    public Long getTotalCharactersTyped() {
        return totalCharactersTyped;
    }

    public void setTotalCharactersTyped(Long totalCharactersTyped) {
        this.totalCharactersTyped = totalCharactersTyped;
    }

    public Integer getCurrentStreak() {
        return currentStreak;
    }

    public void setCurrentStreak(Integer currentStreak) {
        this.currentStreak = currentStreak;
    }

    public Integer getBestStreak() {
        return bestStreak;
    }

    public void setBestStreak(Integer bestStreak) {
        this.bestStreak = bestStreak;
    }

    public List<PracticeSessionResponse> getRecentSessions() {
        return recentSessions;
    }

    public void setRecentSessions(List<PracticeSessionResponse> recentSessions) {
        this.recentSessions = recentSessions;
    }

    public List<DailyActivityPointResponse> getDailyActivity() {
        return dailyActivity;
    }

    public void setDailyActivity(List<DailyActivityPointResponse> dailyActivity) {
        this.dailyActivity = dailyActivity;
    }

    public Long getTotalXp() {
        return totalXp;
    }

    public void setTotalXp(Long totalXp) {
        this.totalXp = totalXp;
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
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

    public Long getCompletedChallengesCount() {
        return completedChallengesCount;
    }

    public void setCompletedChallengesCount(Long completedChallengesCount) {
        this.completedChallengesCount = completedChallengesCount;
    }

    public Integer getUnlockedAchievementsCount() {
        return unlockedAchievementsCount;
    }

    public void setUnlockedAchievementsCount(Integer unlockedAchievementsCount) {
        this.unlockedAchievementsCount = unlockedAchievementsCount;
    }

    public Integer getTotalAchievementsCount() {
        return totalAchievementsCount;
    }

    public void setTotalAchievementsCount(Integer totalAchievementsCount) {
        this.totalAchievementsCount = totalAchievementsCount;
    }

    public List<com.devtype.achievement.dto.AchievementResponse> getRecentAchievements() {
        return recentAchievements;
    }

    public void setRecentAchievements(List<com.devtype.achievement.dto.AchievementResponse> recentAchievements) {
        this.recentAchievements = recentAchievements != null ? recentAchievements : new ArrayList<>();
    }

    public Long getSrsDueCardsCount() {
        return srsDueCardsCount;
    }

    public void setSrsDueCardsCount(Long srsDueCardsCount) {
        this.srsDueCardsCount = srsDueCardsCount;
    }

    public Long getSrsTotalCardsCount() {
        return srsTotalCardsCount;
    }

    public void setSrsTotalCardsCount(Long srsTotalCardsCount) {
        this.srsTotalCardsCount = srsTotalCardsCount;
    }
}

