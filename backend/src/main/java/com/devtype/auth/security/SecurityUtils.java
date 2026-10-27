package com.devtype.auth.security;

import com.devtype.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Optional;

/**
 * Reusable utility for extracting the verified authenticated user's identity and privileges.
 * Enforces strict security boundaries to prevent client-supplied identifier spoofing.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    /**
     * Extracts the current authenticated user's database ID from the SecurityContext.
     *
     * @return Optional containing the Long ID if present and valid, otherwise empty.
     */
    public static Optional<Long> getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return Optional.empty();
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            try {
                return Optional.of(Long.parseLong(jwt.getSubject()));
            } catch (NumberFormatException e) {
                return Optional.empty();
            }
        }

        // Fallback for mock test principals where authentication.getName() contains the ID
        try {
            return Optional.of(Long.parseLong(authentication.getName()));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    /**
     * Retrieves the current authenticated user's ID, throwing an unauthorized exception if unauthenticated.
     *
     * @return Authenticated user's primary key ID.
     * @throws ApiException if no valid authenticated user exists in the security context.
     */
    public static Long getRequiredCurrentUserId() {
        return getCurrentUserId()
                .orElseThrow(() -> new ApiException("User authentication is required to access this resource", HttpStatus.UNAUTHORIZED));
    }

    /**
     * Checks if the currently authenticated user possesses the specified role.
     *
     * @param role Role to check (e.g., "ROLE_ADMIN" or "ADMIN")
     * @return true if the authority is present in the SecurityContext.
     */
    public static boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String targetRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(targetRole::equals);
    }
}
