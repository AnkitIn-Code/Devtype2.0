package com.devtype.auth.security;

import com.devtype.common.dto.ErrorResponse;
import com.devtype.user.User;
import com.devtype.user.UserRepository;
import com.devtype.user.UserStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;

/**
 * Security filter ensuring immediate enforcement of account status changes (suspension, deactivation).
 * Intercepts authenticated requests and checks whether the user's account has been suspended or deactivated,
 * rendering existing active JWT tokens instantly ineffective without waiting for token expiration.
 */
@Component
public class UserAccountStatusFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public UserAccountStatusFilter(UserRepository userRepository, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Optional<Long> currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId.isPresent()) {
            Optional<User> userOpt = userRepository.findById(currentUserId.get());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (user.getStatus() == UserStatus.SUSPENDED) {
                    sendForbiddenResponse(request, response, "Account is suspended. Please contact support.");
                    return;
                }
                if (user.getStatus() == UserStatus.DEACTIVATED) {
                    sendForbiddenResponse(request, response, "Account is deactivated. Please contact support.");
                    return;
                }

                // Authoritative server-side role synchronization:
                // If a user's role was changed in the database while an existing JWT is still active,
                // synchronize the SecurityContext authorities to ensure immediate privilege enforcement.
                org.springframework.security.core.Authentication auth =
                        org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated()) {
                    String actualAuthority = "ROLE_" + user.getRole().name();
                    boolean hasExactAuthority = auth.getAuthorities().stream()
                            .anyMatch(a -> actualAuthority.equals(a.getAuthority()));
                    if (!hasExactAuthority) {
                        var newAuthorities = java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority(actualAuthority));
                        if (auth instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth) {
                            org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                                    new org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken(
                                            jwtAuth.getToken(),
                                            newAuthorities,
                                            jwtAuth.getName()
                                    )
                            );
                        } else {
                            org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                            auth.getPrincipal(),
                                            auth.getCredentials(),
                                            newAuthorities
                                    )
                            );
                        }
                    }
                }
            } else {
                // Token presented a user ID that has been removed from the database
                sendUnauthorizedResponse(request, response, "User account no longer exists.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void sendForbiddenResponse(HttpServletRequest request, HttpServletResponse response, String message)
            throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.FORBIDDEN.value())
                .error(HttpStatus.FORBIDDEN.getReasonPhrase())
                .message(message)
                .path(request.getRequestURI())
                .correlationId(org.slf4j.MDC.get("correlationId"))
                .build();

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }

    private void sendUnauthorizedResponse(HttpServletRequest request, HttpServletResponse response, String message)
            throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.UNAUTHORIZED.value())
                .error(HttpStatus.UNAUTHORIZED.getReasonPhrase())
                .message(message)
                .path(request.getRequestURI())
                .correlationId(org.slf4j.MDC.get("correlationId"))
                .build();

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
