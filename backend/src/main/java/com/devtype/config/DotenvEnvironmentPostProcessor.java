package com.devtype.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Automatically detects and loads environment variables from a local .env file
 * into the Spring Environment for seamless local development.
 * Real system environment variables and system properties always take precedence.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "dotenvProperties";
    public static final int DEFAULT_ORDER = Ordered.HIGHEST_PRECEDENCE + 5;

    @Override
    public int getOrder() {
        return DEFAULT_ORDER;
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        List<File> candidates = List.of(
                new File(".env"),
                new File("backend/.env"),
                new File("../backend/.env"),
                new File("../.env")
        );

        for (File file : candidates) {
            if (file.exists() && file.isFile()) {
                Map<String, Object> props = loadEnvFile(file);
                if (!props.isEmpty()) {
                    environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, props));
                    System.out.println("[Dotenv] Loaded " + props.size() + " environment variables from: " + file.getAbsolutePath());
                }
                break;
            }
        }
    }

    private Map<String, Object> loadEnvFile(File file) {
        Map<String, Object> properties = new HashMap<>();
        try (BufferedReader reader = new BufferedReader(new FileReader(file, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                int eqIdx = line.indexOf('=');
                if (eqIdx > 0) {
                    String key = line.substring(0, eqIdx).trim();
                    String value = line.substring(eqIdx + 1).trim();
                    if ((value.startsWith("\"") && value.endsWith("\"")) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.substring(1, value.length() - 1);
                    }
                    properties.put(key, value);
                }
            }
        } catch (IOException ignored) {
        }
        return properties;
    }
}
