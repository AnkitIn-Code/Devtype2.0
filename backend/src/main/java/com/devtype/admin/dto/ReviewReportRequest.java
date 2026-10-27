package com.devtype.admin.dto;

import com.devtype.user.ReportStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewReportRequest(
        @NotNull(message = "Report status is required")
        ReportStatus status,

        @Size(max = 1000, message = "Resolution note cannot exceed 1000 characters")
        String resolutionNote
) {}
