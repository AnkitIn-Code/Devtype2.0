package com.devtype.practice.dto;

/**
 * Request payload for initializing a server-side practice session.
 */
public class StartPracticeSessionRequest {

    private Long templateId;
    private String templateSlug;

    // Optional direct custom / AI template snapshot fields for immediate practice
    private String customTitle;
    private String customLanguage;
    private String customDifficulty;
    private String customContent;

    public StartPracticeSessionRequest() {
    }

    public StartPracticeSessionRequest(Long templateId, String templateSlug) {
        this.templateId = templateId;
        this.templateSlug = templateSlug;
    }

    public StartPracticeSessionRequest(String customTitle, String customLanguage, String customDifficulty, String customContent) {
        this.customTitle = customTitle;
        this.customLanguage = customLanguage;
        this.customDifficulty = customDifficulty;
        this.customContent = customContent;
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

    public String getCustomTitle() {
        return customTitle;
    }

    public void setCustomTitle(String customTitle) {
        this.customTitle = customTitle;
    }

    public String getCustomLanguage() {
        return customLanguage;
    }

    public void setCustomLanguage(String customLanguage) {
        this.customLanguage = customLanguage;
    }

    public String getCustomDifficulty() {
        return customDifficulty;
    }

    public void setCustomDifficulty(String customDifficulty) {
        this.customDifficulty = customDifficulty;
    }

    public String getCustomContent() {
        return customContent;
    }

    public void setCustomContent(String customContent) {
        this.customContent = customContent;
    }
}
