package com.devtype.admin.dto;

import com.devtype.user.ReportStatus;
import com.devtype.user.User;
import com.devtype.user.UserReport;

import java.time.Instant;

public record AdminReportResponse(
        Long id,
        String category,
        String description,
        ReportStatus status,
        UserSummary reporter,
        UserSummary reportedUser,
        UserSummary reviewedByUser,
        Instant reviewedAt,
        String resolutionNote,
        Instant createdAt,
        Instant updatedAt
) {
    public record UserSummary(Long id, String username, String displayName, String email) {
        public static UserSummary from(User user) {
            if (user == null) return null;
            return new UserSummary(user.getId(), user.getUsername(), user.getDisplayName(), user.getEmail());
        }
    }

    public static AdminReportResponse from(UserReport report) {
        return new AdminReportResponse(
                report.getId(),
                report.getCategory(),
                report.getDescription(),
                report.getStatus(),
                UserSummary.from(report.getReporter()),
                UserSummary.from(report.getReportedUser()),
                UserSummary.from(report.getReviewedByUser()),
                report.getReviewedAt(),
                report.getResolutionNote(),
                report.getCreatedAt(),
                report.getUpdatedAt()
        );
    }
}
