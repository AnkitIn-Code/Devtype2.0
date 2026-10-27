package com.devtype.practice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for submitting completion data for an in-progress practice session.
 */
public class CompletePracticeSessionRequest {

    @NotNull(message = "Total keystrokes must not be null")
    @Min(value = 0, message = "Total keystrokes cannot be negative")
    private Integer totalKeystrokes;

    @NotNull(message = "Correct characters must not be null")
    @Min(value = 0, message = "Correct characters cannot be negative")
    private Integer correctCharacters;

    @Min(value = 0, message = "Incorrect characters cannot be negative")
    private Integer incorrectCharacters;

    @Min(value = 0, message = "Error count cannot be negative")
    private Integer errorCount;

    @Min(value = 0, message = "Elapsed milliseconds cannot be negative")
    private Long elapsedMs;

    private String typedText;

    public CompletePracticeSessionRequest() {
    }

    public CompletePracticeSessionRequest(Integer totalKeystrokes, Integer correctCharacters,
                                          Integer incorrectCharacters, Integer errorCount, Long elapsedMs) {
        this.totalKeystrokes = totalKeystrokes;
        this.correctCharacters = correctCharacters;
        this.incorrectCharacters = incorrectCharacters;
        this.errorCount = errorCount;
        this.elapsedMs = elapsedMs;
    }

    public Integer getTotalKeystrokes() {
        return totalKeystrokes;
    }

    public void setTotalKeystrokes(Integer totalKeystrokes) {
        this.totalKeystrokes = totalKeystrokes;
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

    public Integer getErrorCount() {
        return errorCount;
    }

    public void setErrorCount(Integer errorCount) {
        this.errorCount = errorCount;
    }

    public Long getElapsedMs() {
        return elapsedMs;
    }

    public void setElapsedMs(Long elapsedMs) {
        this.elapsedMs = elapsedMs;
    }

    public String getTypedText() {
        return typedText;
    }

    public void setTypedText(String typedText) {
        this.typedText = typedText;
    }
}
