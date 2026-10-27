package com.devtype;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * DevType Application Entry Point.
 * Multi-user code typing platform modular monolith.
 */
@SpringBootApplication
public class DevTypeApplication {

    public static void main(String[] args) {
        loadDotenv();
        SpringApplication.run(DevTypeApplication.class, args);
    }

    private static void loadDotenv() {
        for (String path : java.util.List.of(".env", "backend/.env", "../backend/.env", "../.env")) {
            java.io.File file = new java.io.File(path);
            if (file.exists() && file.isFile()) {
                try (java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.FileReader(file, java.nio.charset.StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int eqIdx = line.indexOf('=');
                        if (eqIdx > 0) {
                            String key = line.substring(0, eqIdx).trim();
                            String val = line.substring(eqIdx + 1).trim();
                            if ((val.startsWith("\"") && val.endsWith("\"")) ||
                                (val.startsWith("'") && val.endsWith("'"))) {
                                val = val.substring(1, val.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, val);
                            }
                        }
                    }
                    System.out.println("[DevType] Loaded environment variables from: " + file.getAbsolutePath());
                    break;
                } catch (Exception ignored) {
                }
            }
        }
    }
}
