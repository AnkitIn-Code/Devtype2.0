package com.devtype.admin.service;

import com.devtype.user.AccountType;
import com.devtype.user.User;
import com.devtype.user.UserRepository;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Controlled initial administrator provisioning service.
 * Strictly disabled by default. Requires explicit deployment configuration
 * (e.g., DEVTYPE_ADMIN_BOOTSTRAP_ENABLED=true and a strong DEVTYPE_ADMIN_BOOTSTRAP_PASSWORD).
 * Never uses default passwords and does not expose privileged accounts via public signup.
 */
@Service
public class AdminBootstrapService {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminAuditLogService auditLogService;

    @Value("${devtype.admin.bootstrap.enabled:false}")
    private boolean enabled;

    @Value("${devtype.admin.bootstrap.username:}")
    private String username;

    @Value("${devtype.admin.bootstrap.email:}")
    private String email;

    @Value("${devtype.admin.bootstrap.password:}")
    private String password;

    @Value("${devtype.admin.bootstrap.display-name:DevType Administrator}")
    private String displayName;

    public AdminBootstrapService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AdminAuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void onApplicationReady() {
        if (!enabled) {
            log.debug("Admin bootstrap is disabled (devtype.admin.bootstrap.enabled=false). Skipping.");
            return;
        }

        if (password == null || password.trim().length() < 10) {
            log.warn("CRITICAL: Admin bootstrap was enabled but rejected: devtype.admin.bootstrap.password must be configured with at least 10 characters.");
            return;
        }

        if (username == null || username.isBlank() || email == null || email.isBlank()) {
            log.warn("CRITICAL: Admin bootstrap was enabled but rejected: username and email must not be blank.");
            return;
        }

        String targetEmail = email.trim().toLowerCase();
        String targetUsername = username.trim().toLowerCase();

        var existingUserOpt = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(targetUsername, targetEmail);
        if (existingUserOpt.isPresent()) {
            User existing = existingUserOpt.get();
            if (existing.getRole() == UserRole.ADMIN) {
                log.info("Admin bootstrap: Administrator account '{}' already provisioned. No action taken.", targetUsername);
                return;
            }

            // Upgrade existing user to administrator
            existing.setRole(UserRole.ADMIN);
            existing.setStatus(UserStatus.ACTIVE);
            existing.setPasswordHash(passwordEncoder.encode(password));
            userRepository.save(existing);

            auditLogService.recordLog(
                    existing.getId(),
                    "ADMIN_BOOTSTRAP",
                    "USER",
                    existing.getId(),
                    "USER",
                    "ADMIN",
                    "Elevated account to initial administrator via explicit bootstrap configuration",
                    null
            );

            log.info("Admin bootstrap: Successfully elevated user '{}' ({}) to ADMIN role.", existing.getUsername(), existing.getEmail());
            return;
        }

        User newAdmin = new User();
        newAdmin.setUsername(targetUsername);
        newAdmin.setEmail(targetEmail);
        newAdmin.setPasswordHash(passwordEncoder.encode(password));
        newAdmin.setDisplayName(displayName.trim());
        newAdmin.setRole(UserRole.ADMIN);
        newAdmin.setStatus(UserStatus.ACTIVE);
        newAdmin.setAccountType(AccountType.STANDARD);

        User saved = userRepository.save(newAdmin);

        auditLogService.recordLog(
                saved.getId(),
                "ADMIN_BOOTSTRAP",
                "USER",
                saved.getId(),
                "NONE",
                "ADMIN",
                "Provisioned initial administrator account via explicit bootstrap configuration",
                null
        );

        log.info("Admin bootstrap: Successfully provisioned new initial administrator '{}' ({}).", saved.getUsername(), saved.getEmail());
    }
}
