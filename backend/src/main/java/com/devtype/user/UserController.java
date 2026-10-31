package com.devtype.user;

import com.devtype.auth.security.SecurityUtils;
import com.devtype.common.dto.ApiResponse;
import com.devtype.dashboard.dto.DashboardSummaryResponse;
import com.devtype.dashboard.service.DashboardService;
import com.devtype.user.dto.UserProfileResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for authenticated developer profile operations.
 * Derives user identity exclusively from the validated security context.
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final DashboardService dashboardService;
    private final com.devtype.xp.service.XpService xpService;

    public UserController(UserService userService, DashboardService dashboardService, com.devtype.xp.service.XpService xpService) {
        this.userService = userService;
        this.dashboardService = dashboardService;
        this.xpService = xpService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser() {
        Long authenticatedUserId = SecurityUtils.getRequiredCurrentUserId();
        UserProfileResponse profile = userService.getCurrentUserProfile(authenticatedUserId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/me/dashboard")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getCurrentUserDashboard() {
        Long authenticatedUserId = SecurityUtils.getRequiredCurrentUserId();
        DashboardSummaryResponse dashboard = dashboardService.getDashboardSummary(authenticatedUserId);
        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }

    @GetMapping("/me/xp")
    public ResponseEntity<ApiResponse<com.devtype.xp.dto.UserLevelProgression>> getCurrentUserXp() {
        Long authenticatedUserId = SecurityUtils.getRequiredCurrentUserId();
        com.devtype.xp.dto.UserLevelProgression progression = xpService.getUserProgression(authenticatedUserId);
        return ResponseEntity.ok(ApiResponse.success(progression, "User XP and level progression retrieved successfully"));
    }

    @org.springframework.web.bind.annotation.PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody com.devtype.user.dto.UpdateProfileRequest request) {
        Long authenticatedUserId = SecurityUtils.getRequiredCurrentUserId();
        UserProfileResponse updated = userService.updateUserProfile(authenticatedUserId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "User profile updated successfully"));
    }

    @GetMapping("/me/preferences")
    public ResponseEntity<ApiResponse<com.devtype.user.dto.UserPreferencesResponse>> getPreferences() {
        Long authenticatedUserId = SecurityUtils.getRequiredCurrentUserId();
        com.devtype.user.dto.UserPreferencesResponse prefs = userService.getUserPreferences(authenticatedUserId);
        return ResponseEntity.ok(ApiResponse.success(prefs, "User preferences retrieved successfully"));
    }

    @org.springframework.web.bind.annotation.PutMapping("/me/preferences")
    public ResponseEntity<ApiResponse<com.devtype.user.dto.UserPreferencesResponse>> updatePreferences(
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody com.devtype.user.dto.UpdatePreferencesRequest request) {
        Long authenticatedUserId = SecurityUtils.getRequiredCurrentUserId();
        com.devtype.user.dto.UserPreferencesResponse updated = userService.updateUserPreferences(authenticatedUserId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "User preferences updated successfully"));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteAccount() {
        Long authenticatedUserId = SecurityUtils.getRequiredCurrentUserId();
        userService.deleteCurrentUser(authenticatedUserId);
        return ResponseEntity.ok(ApiResponse.success(null, "Account successfully deleted"));
    }
}
