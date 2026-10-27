package com.devtype.admin.dto;

import com.devtype.user.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserRoleRequest(
        @NotNull(message = "Role is required")
        UserRole role,

        @NotBlank(message = "Reason is required for role modification")
        @Size(min = 3, max = 500, message = "Reason must be between 3 and 500 characters")
        String reason
) {}
