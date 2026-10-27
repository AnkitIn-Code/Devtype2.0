package com.devtype.auth.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Configuration holder for JWT signing secrets, token validity, and issuer metadata.
 */
@Component
public class JwtProperties {

    private final String issuer;
    private final String secret;
    private final long accessTokenExpirationSeconds;

    private final org.springframework.core.env.Environment environment;

    public JwtProperties(
            @Value("${devtype.jwt.issuer:devtype-backend}") String issuer,
            @Value("${devtype.jwt.secret:devtype-default-secure-hmac-sha256-signing-secret-key-at-least-256-bits!}") String secret,
            @Value("${devtype.jwt.access-token-expiration-seconds:2592000}") long accessTokenExpirationSeconds,
            org.springframework.core.env.Environment environment) {
        this.issuer = issuer;
        this.secret = secret;
        this.accessTokenExpirationSeconds = accessTokenExpirationSeconds;
        this.environment = environment;
    }

    @jakarta.annotation.PostConstruct
    public void validate() {
        if (secret == null || secret.trim().length() < 32) {
            throw new IllegalStateException("JWT secret must be at least 256 bits (32 characters) long.");
        }
        if (environment != null && (environment.matchesProfiles("prod") || environment.matchesProfiles("production"))) {
            if (secret.contains("devtype-default-secure-hmac-sha256") || secret.contains("devtype-default")) {
                throw new IllegalStateException("Default JWT secret cannot be used in production. Please set the JWT_SECRET environment variable.");
            }
        }
    }

    public String getIssuer() {
        return issuer;
    }

    public String getSecret() {
        return secret;
    }

    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpirationSeconds;
    }
}
