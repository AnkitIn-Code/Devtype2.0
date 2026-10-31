package com.devtype.snippet;

import com.devtype.common.entity.AuditableEntity;
import jakarta.persistence.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "snippets")
public class Snippet extends AuditableEntity {

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 150)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String language;

    @Column(nullable = false, length = 100)
    private String category = "Custom";

    @Column(name = "sub_category", length = 100)
    private String subCategory;

    @Column(nullable = false, length = 30)
    private String difficulty = "INTERMEDIATE";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String code;

    @Column(length = 255)
    private String tags;

    @Column(name = "is_curated", nullable = false)
    private boolean isCurated = false;

    @Column(name = "is_custom", nullable = false)
    private boolean isCustom = true;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "xp_bounty", nullable = false)
    private int xpBounty = 40;

    public Snippet() {
        super();
    }

    public Snippet(String title, String slug, String description, String language,
                   String category, String subCategory, String difficulty, String code,
                   String tags, boolean isCurated, boolean isCustom, Long createdByUserId, int xpBounty) {
        super();
        this.title = title;
        this.slug = slug;
        this.description = description;
        this.language = language;
        this.category = category != null ? category : "Custom";
        this.subCategory = subCategory;
        this.difficulty = difficulty != null ? difficulty : "INTERMEDIATE";
        this.code = code;
        this.tags = tags;
        this.isCurated = isCurated;
        this.isCustom = isCustom;
        this.createdByUserId = createdByUserId;
        this.xpBounty = xpBounty > 0 ? xpBounty : 40;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSubCategory() {
        return subCategory;
    }

    public void setSubCategory(String subCategory) {
        this.subCategory = subCategory;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public List<String> getTagsList() {
        if (tags == null || tags.isBlank()) return Collections.emptyList();
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public boolean isCurated() {
        return isCurated;
    }

    public void setCurated(boolean curated) {
        isCurated = curated;
    }

    public boolean isCustom() {
        return isCustom;
    }

    public void setCustom(boolean custom) {
        isCustom = custom;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public int getXpBounty() {
        return xpBounty;
    }

    public void setXpBounty(int xpBounty) {
        this.xpBounty = xpBounty;
    }
}
