package com.devtype.user.dto;

import com.devtype.user.UserPreferences;

/**
 * Data transfer object representing user application preferences.
 */
public record UserPreferencesResponse(
        String theme,
        String defaultLanguage,
        String defaultDifficulty,
        boolean soundEnabled
) {
    public static UserPreferencesResponse fromEntity(UserPreferences preferences) {
        return new UserPreferencesResponse(
                preferences.getTheme(),
                preferences.getDefaultLanguage(),
                preferences.getDefaultDifficulty(),
                preferences.isSoundEnabled()
        );
    }
}
