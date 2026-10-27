package com.devtype.admin.dto;

import com.devtype.user.UserStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserStatusRequest(
        @NotNull(message = "Account status is required")
        UserStatus status,

        @NotBlank(message = "Reason is required for account status changes")
        @Size(min = 3, max = 500, message = "Reason must be between 3 and 500 characters")
        String reason
) {}
