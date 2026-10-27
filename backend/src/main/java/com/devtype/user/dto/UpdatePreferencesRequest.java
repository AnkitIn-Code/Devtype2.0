package com.devtype.user.dto;

import jakarta.validation.constraints.Size;

/**
 * Data transfer object for updating user application preferences.
 */
public record UpdatePreferencesRequest(
        @Size(max = 50, message = "Theme must not exceed 50 characters")
        String theme,

        @Size(max = 50, message = "Default language must not exceed 50 characters")
        String defaultLanguage,

        @Size(max = 50, message = "Default difficulty must not exceed 50 characters")
        String defaultDifficulty,

        Boolean soundEnabled
) {
}
