package com.devtype.auth.dto;

import com.devtype.user.AccountType;
import com.devtype.user.User;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;

import java.time.Instant;

/**
 * Sanitized user summary returned within authentication responses.
 * Strictly excludes password hashes and sensitive operational credentials.
 */
public class UserSummaryResponse {

    private Long id;
    private String username;
    private String email;
    private String displayName;
    private String avatarUrl;
    private UserRole role;
    private UserStatus accountStatus;
    private AccountType accountType;
    private Instant createdAt;
    private Instant lastLoginAt;

    public UserSummaryResponse() {
    }

    public UserSummaryResponse(Long id, String username, String email, String displayName,
                               String avatarUrl, UserRole role, UserStatus accountStatus,
                               AccountType accountType, Instant createdAt, Instant lastLoginAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.role = role;
        this.accountStatus = accountStatus;
        this.accountType = accountType;
        this.createdAt = createdAt;
        this.lastLoginAt = lastLoginAt;
    }

    public static UserSummaryResponse fromUser(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getRole(),
                user.getStatus(),
                user.getAccountType(),
                user.getCreatedAt(),
                user.getLastLoginAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public UserStatus getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(UserStatus accountStatus) {
        this.accountStatus = accountStatus;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(Instant lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }
}
