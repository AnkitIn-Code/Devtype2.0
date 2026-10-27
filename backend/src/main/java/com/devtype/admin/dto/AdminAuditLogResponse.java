package com.devtype.admin.dto;

import com.devtype.admin.entity.AdminAuditLog;

import java.time.Instant;

public record AdminAuditLogResponse(
        Long id,
        AdminSummary adminUser,
        String actionType,
        String targetType,
        Long targetId,
        String previousState,
        String newState,
        String reason,
        String ipAddress,
        Instant createdAt
) {
    public record AdminSummary(Long id, String username, String displayName) {}

    public static AdminAuditLogResponse from(AdminAuditLog log) {
        AdminSummary admin = log.getAdminUser() != null
                ? new AdminSummary(log.getAdminUser().getId(), log.getAdminUser().getUsername(), log.getAdminUser().getDisplayName())
                : new AdminSummary(null, "system", "System");

        return new AdminAuditLogResponse(
                log.getId(),
                admin,
                log.getActionType(),
                log.getTargetType(),
                log.getTargetId(),
                log.getPreviousState(),
                log.getNewState(),
                log.getReason(),
                log.getIpAddress(),
                log.getCreatedAt()
        );
    }
}
