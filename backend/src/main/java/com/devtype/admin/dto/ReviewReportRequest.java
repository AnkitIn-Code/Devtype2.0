package com.devtype.admin.dto;

import com.devtype.user.ReportStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewReportRequest(
        @NotNull(message = "Report status is required")
        ReportStatus status,

        @Size(max = 1000, message = "Resolution note cannot exceed 1000 characters")
        String resolutionNote,

        @Size(max = 2000, message = "Admin response message cannot exceed 2000 characters")
        String adminResponse
) {
    public ReviewReportRequest(ReportStatus status, String resolutionNote) {
        this(status, resolutionNote, null);
    }
}
