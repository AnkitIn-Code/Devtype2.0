package com.devtype.user;

import com.devtype.common.entity.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/**
 * Isolated user preferences entity defining independent settings for each developer.
 */
@Entity
@Table(name = "user_preferences")
public class UserPreferences extends AuditableEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "theme", nullable = false, length = 50)
    private String theme = "dark";

    @Column(name = "default_language", nullable = false, length = 50)
    private String defaultLanguage = "javascript";

    @Column(name = "default_difficulty", nullable = false, length = 50)
    private String defaultDifficulty = "INTERMEDIATE";

    @Column(name = "sound_enabled", nullable = false)
    private boolean soundEnabled = true;

    public UserPreferences() {
        super();
    }

    public UserPreferences(User user) {
        this.user = user;
        this.theme = "dark";
        this.defaultLanguage = "javascript";
        this.defaultDifficulty = "INTERMEDIATE";
        this.soundEnabled = true;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public String getDefaultLanguage() {
        return defaultLanguage;
    }

    public void setDefaultLanguage(String defaultLanguage) {
        this.defaultLanguage = defaultLanguage;
    }

    public String getDefaultDifficulty() {
        return defaultDifficulty;
    }

    public void setDefaultDifficulty(String defaultDifficulty) {
        this.defaultDifficulty = defaultDifficulty;
    }

    public boolean isSoundEnabled() {
        return soundEnabled;
    }

    public void setSoundEnabled(boolean soundEnabled) {
        this.soundEnabled = soundEnabled;
    }
}
