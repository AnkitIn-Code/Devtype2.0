package com.devtype.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

/**
 * Global CORS configuration supporting decoupled frontend client communication.
 */
@Configuration
public class CorsConfig {

    private final List<String> allowedOrigins;
    private final List<String> allowedMethods;
    private final List<String> allowedHeaders;
    private final boolean allowCredentials;
    private final long maxAge;

    public CorsConfig(
            @Value("${devtype.cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175,http://localhost:*,http://127.0.0.1:*}") String allowedOrigins,
            @Value("${devtype.cors.allowed-methods:GET,POST,PUT,PATCH,DELETE,OPTIONS}") String allowedMethods,
            @Value("${devtype.cors.allowed-headers:*}") String allowedHeaders,
            @Value("${devtype.cors.allow-credentials:true}") boolean allowCredentials,
            @Value("${devtype.cors.max-age:3600}") long maxAge) {
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(",")).map(String::trim).toList();
        this.allowedMethods = Arrays.stream(allowedMethods.split(",")).map(String::trim).toList();
        this.allowedHeaders = Arrays.stream(allowedHeaders.split(",")).map(String::trim).toList();
        this.allowCredentials = allowCredentials;
        this.maxAge = maxAge;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(allowedOrigins);
        config.setAllowedMethods(allowedMethods);
        config.setAllowedHeaders(allowedHeaders);
        config.setAllowCredentials(allowCredentials);
        config.setMaxAge(maxAge);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public CorsFilter corsFilter(CorsConfigurationSource corsConfigurationSource) {
        return new CorsFilter(corsConfigurationSource);
    }
}
