package com.devtype.auth.service;

import com.devtype.auth.dto.AuthResponse;
import com.devtype.auth.dto.LoginRequest;
import com.devtype.auth.dto.RegisterRequest;
import com.devtype.auth.dto.UserSummaryResponse;
import com.devtype.common.exception.ApiException;
import com.devtype.user.AccountType;
import com.devtype.user.User;
import com.devtype.user.UserPreferences;
import com.devtype.user.UserPreferencesRepository;
import com.devtype.user.UserRepository;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

/**
 * Service managing user registration, credential verification, and session token generation.
 * Enforces normalization, server-side role assignment, and zero password leakage.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final UserPreferencesRepository userPreferencesRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final io.micrometer.core.instrument.MeterRegistry meterRegistry;

    public AuthService(
            UserRepository userRepository,
            UserPreferencesRepository userPreferencesRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            io.micrometer.core.instrument.MeterRegistry meterRegistry) {
        this.userRepository = userRepository;
        this.userPreferencesRepository = userPreferencesRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.meterRegistry = meterRegistry;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedUsername = request.getUsername().trim().toLowerCase(Locale.ROOT);
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new ApiException("Username is already taken", HttpStatus.CONFLICT);
        }

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ApiException("Email is already registered", HttpStatus.CONFLICT);
        }

        User user = new User();
        user.setUsername(normalizedUsername);
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setDisplayName(request.getDisplayName().trim());
        user.setRole(UserRole.USER); // Server-side enforced: public registration can never create ADMIN
        user.setStatus(UserStatus.ACTIVE);
        user.setAccountType(AccountType.STANDARD);

        User savedUser;
        try {
            savedUser = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            log.warn("Uniqueness race detected during registration for username '{}' or email '{}'", normalizedUsername, normalizedEmail);
            throw new ApiException("Username or email already exists", HttpStatus.CONFLICT);
        }

        // Initialize default user preferences
        UserPreferences preferences = new UserPreferences(savedUser);
        userPreferencesRepository.save(preferences);

        log.info("Successfully registered new user ID: {}, username: {}", savedUser.getId(), savedUser.getUsername());

        String token = jwtService.generateToken(savedUser);
        return new AuthResponse(token, jwtService.getExpirationSeconds(), UserSummaryResponse.fromUser(savedUser));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getUsernameOrEmail().trim().toLowerCase(Locale.ROOT);

        User user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(identifier, identifier)
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            meterRegistry.counter("devtype.auth.attempts", "outcome", "failure", "reason", "bad_credentials").increment();
            log.warn("Failed authentication attempt for identifier '{}'", identifier);
            throw new ApiException("Invalid username/email or password", HttpStatus.UNAUTHORIZED);
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            // Check if suspension period has expired; auto-reinstate if true
            if (user.getSuspendedUntil() != null && Instant.now().isAfter(user.getSuspendedUntil())) {
                log.info("Suspension period expired for user ID: {}. Automatically restoring account to ACTIVE.", user.getId());
                user.setStatus(UserStatus.ACTIVE);
                user.setSuspendedUntil(null);
                user.setSuspensionReason(null);
                userRepository.save(user);
            } else {
                meterRegistry.counter("devtype.auth.attempts", "outcome", "failure", "reason", "account_suspended").increment();
                log.warn("Login attempt for suspended user ID: {}", user.getId());

                String timeRemaining = "indefinite";
                if (user.getSuspendedUntil() != null) {
                    Duration remaining = Duration.between(Instant.now(), user.getSuspendedUntil());
                    long totalHours = remaining.toHours();
                    long days = totalHours / 24;
                    long hours = totalHours % 24;
                    if (days > 0) {
                        timeRemaining = days + " day" + (days > 1 ? "s" : "") + (hours > 0 ? ", " + hours + " hr" + (hours > 1 ? "s" : "") : "");
                    } else if (hours > 0) {
                        long minutes = remaining.toMinutes() % 60;
                        timeRemaining = hours + " hr" + (hours > 1 ? "s" : "") + (minutes > 0 ? ", " + minutes + " min" : "");
                    } else {
                        long minutes = Math.max(1, remaining.toMinutes());
                        timeRemaining = minutes + " minute" + (minutes > 1 ? "s" : "");
                    }
                }
                String reasonSuffix = (user.getSuspensionReason() != null && !user.getSuspensionReason().isBlank())
                        ? " Reason: " + user.getSuspensionReason() : "";
                throw new ApiException("Account is suspended. Suspension expires in " + timeRemaining + "." + reasonSuffix, HttpStatus.FORBIDDEN);
            }
        }

        if (user.getStatus() == UserStatus.DEACTIVATED) {
            meterRegistry.counter("devtype.auth.attempts", "outcome", "failure", "reason", "account_deactivated").increment();
            log.warn("Login attempt for deactivated user ID: {}", user.getId());

            String deletionNotice = "";
            if (user.getScheduledDeletionAt() != null) {
                if (Instant.now().isAfter(user.getScheduledDeletionAt())) {
                    throw new ApiException("Account is deactivated and queued in the permanent deletion purge pipeline.", HttpStatus.FORBIDDEN);
                }
                long daysRemaining = Math.max(1, Duration.between(Instant.now(), user.getScheduledDeletionAt()).toDays());
                deletionNotice = " Queued for permanent data deletion in " + daysRemaining + " day(s).";
            }
            throw new ApiException("Account is deactivated." + deletionNotice + " Contact support to appeal or reactivate.", HttpStatus.FORBIDDEN);
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        meterRegistry.counter("devtype.auth.attempts", "outcome", "success").increment();
        log.info("Successful login for user ID: {}, username: {}", user.getId(), user.getUsername());

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, jwtService.getExpirationSeconds(), UserSummaryResponse.fromUser(user));
    }
}
