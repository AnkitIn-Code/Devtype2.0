package com.devtype.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Server-side configuration for Fireworks AI and DeepSeek V4 Pro integration.
 * Keeps provider credentials, model selection, and timeouts centralized on the backend.
 */
@Configuration
@ConfigurationProperties(prefix = "devtype.fireworks")
public class FireworksProperties {

    /**
     * Secret API key for Fireworks AI authentication.
     * Supplied via FIREWORKS_API_KEY environment variable. Never exposed to clients.
     */
    private String apiKey;

    /**
     * AI Model Identifier.
     * Default: accounts/fireworks/models/deepseek-v4-pro-0813
     */
    private String model = "accounts/fireworks/models/deepseek-v4-pro-0813";

    /**
     * Base URL for the Fireworks AI inference API.
     * Default: https://api.fireworks.ai/inference/v1
     */
    private String baseUrl = "https://api.fireworks.ai/inference/v1";

    /**
     * Connection timeout in seconds.
     */
    private int connectTimeoutSeconds = 10;

    /**
     * Read timeout in seconds.
     */
    private int readTimeoutSeconds = 45;

    /**
     * Per-user hourly rate limit for template generation.
     */
    private int rateLimitPerHour = 15;

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public int getConnectTimeoutSeconds() {
        return connectTimeoutSeconds;
    }

    public void setConnectTimeoutSeconds(int connectTimeoutSeconds) {
        this.connectTimeoutSeconds = connectTimeoutSeconds;
    }

    public int getReadTimeoutSeconds() {
        return readTimeoutSeconds;
    }

    public void setReadTimeoutSeconds(int readTimeoutSeconds) {
        this.readTimeoutSeconds = readTimeoutSeconds;
    }

    public int getRateLimitPerHour() {
        return rateLimitPerHour;
    }

    public void setRateLimitPerHour(int rateLimitPerHour) {
        this.rateLimitPerHour = rateLimitPerHour;
    }
}
