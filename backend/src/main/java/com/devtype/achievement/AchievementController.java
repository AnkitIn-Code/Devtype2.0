package com.devtype.achievement;

import com.devtype.achievement.dto.AchievementResponse;
import com.devtype.achievement.service.AchievementService;
import com.devtype.auth.security.SecurityUtils;
import com.devtype.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST API for platform accolades and developer milestone progression.
 */
@RestController
@RequestMapping("/api/v1")
public class AchievementController {

    private final AchievementService achievementService;

    public AchievementController(AchievementService achievementService) {
        this.achievementService = achievementService;
    }

    /**
     * Retrieves all achievements with the authenticated user's real progress and unlock state.
     */
    @GetMapping("/achievements")
    public ResponseEntity<ApiResponse<List<AchievementResponse>>> getAchievements() {
        Long userId = SecurityUtils.getRequiredCurrentUserId();
        List<AchievementResponse> achievements = achievementService.getUserAchievements(userId);
        return ResponseEntity.ok(ApiResponse.success(achievements, "Achievements retrieved successfully"));
    }

    /**
     * Alias for user's personal achievements.
     */
    @GetMapping("/users/me/achievements")
    public ResponseEntity<ApiResponse<List<AchievementResponse>>> getMyAchievements() {
        return getAchievements();
    }
}
