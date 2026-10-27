package com.devtype.user.dto;

import com.devtype.user.AccountType;
import com.devtype.user.User;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;

import java.time.Instant;

/**
 * Sanitized profile payload for GET /api/v1/users/me.
 * Excludes sensitive credentials, internal authentication details, and private hashes.
 */
public class UserProfileResponse {

    private Long id;
    private String username;
    private String email;
    private String displayName;
    private String avatarUrl;
    private UserRole role;
    private UserStatus accountStatus;
    private AccountType accountType;
    private Instant createdAt;
    private Long totalXp = 0L;
    private Integer level = 1;
    private Long nextLevelXp = 200L;
    private Integer levelProgressPercent = 0;

    public UserProfileResponse() {
    }

    public UserProfileResponse(Long id, String username, String email, String displayName,
                               String avatarUrl, UserRole role, UserStatus accountStatus,
                               AccountType accountType, Instant createdAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.role = role;
        this.accountStatus = accountStatus;
        this.accountType = accountType;
        this.createdAt = createdAt;
    }

    public static UserProfileResponse fromUser(User user) {
        UserProfileResponse res = new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getRole(),
                user.getStatus(),
                user.getAccountType(),
                user.getCreatedAt()
        );
        long xp = user.getTotalXp() != null ? user.getTotalXp() : 0L;
        res.setTotalXp(xp);

        // Standard level calculation
        double term = 1.0 + (4.0 * xp) / 100.0;
        int lvl = 1 + (int) Math.floor((Math.sqrt(term) - 1.0) / 2.0);
        res.setLevel(Math.max(1, lvl));
        long nextThreshold = 100L * lvl * (lvl + 1);
        res.setNextLevelXp(nextThreshold);

        long currThreshold = 100L * (lvl - 1) * lvl;
        long span = nextThreshold - currThreshold;
        if (span > 0) {
            res.setLevelProgressPercent((int) Math.min(100, Math.max(0, Math.round(((xp - currThreshold) * 100.0) / span))));
        } else {
            res.setLevelProgressPercent(0);
        }

        return res;
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

    public Long getTotalXp() {
        return totalXp;
    }

    public void setTotalXp(Long totalXp) {
        this.totalXp = totalXp;
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }

    public Long getNextLevelXp() {
        return nextLevelXp;
    }

    public void setNextLevelXp(Long nextLevelXp) {
        this.nextLevelXp = nextLevelXp;
    }

    public Integer getLevelProgressPercent() {
        return levelProgressPercent;
    }

    public void setLevelProgressPercent(Integer levelProgressPercent) {
        this.levelProgressPercent = levelProgressPercent;
    }
}
