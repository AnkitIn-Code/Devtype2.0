package com.devtype.user;

import com.devtype.common.exception.ApiException;
import com.devtype.common.exception.ResourceNotFoundException;
import com.devtype.user.dto.UserProfileResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing user profile retrieval, account state verification, and account deletion.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserPreferencesRepository userPreferencesRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public UserService(UserRepository userRepository, UserPreferencesRepository userPreferencesRepository) {
        this.userRepository = userRepository;
        this.userPreferencesRepository = userPreferencesRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new ApiException("Account is suspended. Please contact support.", HttpStatus.FORBIDDEN);
        }

        if (user.getStatus() == UserStatus.DEACTIVATED) {
            throw new ApiException("Account is deactivated. Please contact support.", HttpStatus.FORBIDDEN);
        }

        return UserProfileResponse.fromUser(user);
    }

    @Transactional
    public UserProfileResponse updateUserProfile(Long userId, com.devtype.user.dto.UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new ApiException("Account is suspended. Please contact support.", HttpStatus.FORBIDDEN);
        }
        if (user.getStatus() == UserStatus.DEACTIVATED) {
            throw new ApiException("Account is deactivated. Please contact support.", HttpStatus.FORBIDDEN);
        }

        if (request.displayName() != null && !request.displayName().isBlank()) {
            user.setDisplayName(request.displayName().trim());
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl().trim());
        }

        User savedUser = userRepository.save(user);
        return UserProfileResponse.fromUser(savedUser);
    }

    @Transactional(readOnly = true)
    public com.devtype.user.dto.UserPreferencesResponse getUserPreferences(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        UserPreferences prefs = userPreferencesRepository.findByUserId(userId)
                .orElseGet(() -> new UserPreferences(user));

        return com.devtype.user.dto.UserPreferencesResponse.fromEntity(prefs);
    }

    @Transactional
    public com.devtype.user.dto.UserPreferencesResponse updateUserPreferences(Long userId, com.devtype.user.dto.UpdatePreferencesRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new ApiException("Account is suspended. Please contact support.", HttpStatus.FORBIDDEN);
        }
        if (user.getStatus() == UserStatus.DEACTIVATED) {
            throw new ApiException("Account is deactivated. Please contact support.", HttpStatus.FORBIDDEN);
        }

        UserPreferences prefs = userPreferencesRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserPreferences newPrefs = new UserPreferences(user);
                    return userPreferencesRepository.save(newPrefs);
                });

        if (request.theme() != null && !request.theme().isBlank()) {
            prefs.setTheme(request.theme().trim());
        }
        if (request.defaultLanguage() != null && !request.defaultLanguage().isBlank()) {
            prefs.setDefaultLanguage(request.defaultLanguage().trim());
        }
        if (request.defaultDifficulty() != null && !request.defaultDifficulty().isBlank()) {
            prefs.setDefaultDifficulty(request.defaultDifficulty().trim());
        }
        if (request.soundEnabled() != null) {
            prefs.setSoundEnabled(request.soundEnabled());
        }

        UserPreferences saved = userPreferencesRepository.save(prefs);
        return com.devtype.user.dto.UserPreferencesResponse.fromEntity(saved);
    }

    /**
     * Permanently deletes the authenticated user account and associated resources.
     */
    @Transactional
    public void deleteCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        // Clean up unconstrained multiplayer results prior to cascading user deletion
        try {
            entityManager.createNativeQuery("DELETE FROM multiplayer_results WHERE user_id = :userId")
                    .setParameter("userId", userId)
                    .executeUpdate();
        } catch (Exception ignored) {
            // Non-critical if table is empty or unpopulated
        }

        userRepository.delete(user);
    }
}
