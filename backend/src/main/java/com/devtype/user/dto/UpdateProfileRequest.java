package com.devtype.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Data transfer object for updating developer profile fields.
 * Restricted strictly to non-privileged fields (displayName, avatarUrl).
 */
public record UpdateProfileRequest(
        @NotBlank(message = "Display name cannot be blank")
        @Size(min = 1, max = 100, message = "Display name must not exceed 100 characters")
        String displayName,

        @Size(max = 512, message = "Avatar URL must not exceed 512 characters")
        String avatarUrl
) {
}
