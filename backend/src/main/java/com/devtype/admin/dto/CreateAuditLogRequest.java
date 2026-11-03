package com.devtype.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAuditLogRequest(
        @NotBlank @Size(max = 50) String actionType,
        @NotBlank @Size(max = 50) String targetType,
        Long targetId,
        @Size(max = 255) String previousState,
        @Size(max = 255) String newState,
        String reason
) {}
