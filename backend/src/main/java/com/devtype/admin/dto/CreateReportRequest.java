package com.devtype.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateReportRequest(
        Long reportedUserId,

        @NotBlank(message = "Category is required")
        @Size(max = 50, message = "Category must not exceed 50 characters")
        String category,

        @NotBlank(message = "Description is required")
        @Size(min = 5, max = 2000, message = "Description must be between 5 and 2000 characters")
        String description
) {}
