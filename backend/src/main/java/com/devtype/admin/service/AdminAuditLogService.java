package com.devtype.admin.service;

import com.devtype.admin.dto.AdminAuditLogResponse;
import com.devtype.admin.entity.AdminAuditLog;
import com.devtype.admin.repository.AdminAuditLogRepository;
import com.devtype.user.User;
import com.devtype.user.UserRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdminAuditLogService {

    private final AdminAuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AdminAuditLogService(AdminAuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AdminAuditLog recordLog(Long adminUserId, String actionType, String targetType, Long targetId,
                                  String previousState, String newState, String reason,
                                  HttpServletRequest request) {
        User adminUser = userRepository.findById(adminUserId).orElse(null);
        String ip = extractClientIp(request);
        String userAgent = extractUserAgent(request);

        AdminAuditLog log = new AdminAuditLog(
                adminUser,
                actionType,
                targetType,
                targetId,
                previousState,
                newState,
                reason,
                ip,
                userAgent
        );
        log.setCreatedAt(Instant.now());

        return auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AdminAuditLogResponse> getAuditLogs(String actionType, String targetType, Long adminUserId, Pageable pageable) {
        Specification<AdminAuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (actionType != null && !actionType.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("actionType")), actionType.trim().toUpperCase()));
            }
            if (targetType != null && !targetType.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("targetType")), targetType.trim().toUpperCase()));
            }
            if (adminUserId != null) {
                predicates.add(cb.equal(root.get("adminUser").get("id"), adminUserId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return auditLogRepository.findAll(spec, pageable).map(AdminAuditLogResponse::from);
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return null;
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String extractUserAgent(HttpServletRequest request) {
        if (request == null) return null;
        String ua = request.getHeader("User-Agent");
        if (ua != null && ua.length() > 255) {
            return ua.substring(0, 255);
        }
        return ua;
    }
}
