package com.devtype.admin.dto;

import com.devtype.user.AccountType;
import com.devtype.user.User;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Detailed user information including aggregated activity metrics for admin review.
 */
public record AdminUserDetailResponse(
        Long id,
        String username,
        String email,
        String displayName,
        String avatarUrl,
        UserRole role,
        UserStatus status,
        AccountType accountType,
        Long totalXp,
        Instant createdAt,
        Instant lastLoginAt,
        long totalCompletedSessions,
        long totalPracticeDurationSeconds,
        Double avgNetWpm,
        BigDecimal bestNetWpm,
        Double avgAccuracy,
        long totalChallengesCompleted,
        long totalAchievementsUnlocked,
        long reportsFiledCount,
        long reportsAgainstCount
) {
    public static AdminUserDetailResponse of(
            User user,
            long totalCompletedSessions,
            long totalPracticeDurationSeconds,
            Double avgNetWpm,
            BigDecimal bestNetWpm,
            Double avgAccuracy,
            long totalChallengesCompleted,
            long totalAchievementsUnlocked,
            long reportsFiledCount,
            long reportsAgainstCount
    ) {
        return new AdminUserDetailResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getRole(),
                user.getStatus(),
                user.getAccountType(),
                user.getTotalXp() != null ? user.getTotalXp() : 0L,
                user.getCreatedAt(),
                user.getLastLoginAt(),
                totalCompletedSessions,
                totalPracticeDurationSeconds,
                avgNetWpm != null ? avgNetWpm : 0.0,
                bestNetWpm != null ? bestNetWpm : BigDecimal.ZERO,
                avgAccuracy != null ? avgAccuracy : 0.0,
                totalChallengesCompleted,
                totalAchievementsUnlocked,
                reportsFiledCount,
                reportsAgainstCount
        );
    }
}
