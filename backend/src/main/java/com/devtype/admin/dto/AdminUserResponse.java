package com.devtype.admin.dto;

import com.devtype.user.AccountType;
import com.devtype.user.User;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;

import java.time.Instant;

/**
 * Sanitized user representation for admin user management views.
 * Excludes password hashes and sensitive secrets.
 */
public record AdminUserResponse(
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
        Instant lastLoginAt
) {
    public static AdminUserResponse fromUser(User user) {
        return new AdminUserResponse(
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
                user.getLastLoginAt()
        );
    }
}
