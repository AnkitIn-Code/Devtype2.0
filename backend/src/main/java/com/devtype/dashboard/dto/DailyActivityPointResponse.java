package com.devtype.dashboard.dto;

import java.time.LocalDate;

/**
 * Representation of single-day practice telemetry for activity heatmaps.
 */
public class DailyActivityPointResponse {

    private String date;
    private Integer sessionCount;
    private Long totalPracticeSeconds;
    private Integer totalCharacters;
    private Integer level; // 0..4 intensity level for heatmap rendering

    public DailyActivityPointResponse() {
    }

    public DailyActivityPointResponse(LocalDate date, Integer sessionCount, Long totalPracticeSeconds, Integer totalCharacters) {
        this.date = date != null ? date.toString() : null;
        this.sessionCount = sessionCount != null ? sessionCount : 0;
        this.totalPracticeSeconds = totalPracticeSeconds != null ? totalPracticeSeconds : 0L;
        this.totalCharacters = totalCharacters != null ? totalCharacters : 0;
        this.level = calculateLevel(this.sessionCount);
    }

    private static int calculateLevel(int count) {
        if (count <= 0) return 0;
        if (count <= 2) return 1;
        if (count <= 4) return 2;
        if (count <= 7) return 3;
        return 4;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public Integer getSessionCount() {
        return sessionCount;
    }

    public void setSessionCount(Integer sessionCount) {
        this.sessionCount = sessionCount;
        this.level = calculateLevel(sessionCount != null ? sessionCount : 0);
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

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }
}
