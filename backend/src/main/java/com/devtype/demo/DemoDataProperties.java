package com.devtype.demo;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties controlling development-only demo data initialization.
 * Defaults ensure demo data seeding is strictly disabled unless explicitly enabled.
 */
@Component
@ConfigurationProperties(prefix = "devtype.demo-data")
public class DemoDataProperties {

    /**
     * Master switch for demo data seeding.
     * Must remain false in production environments. Default: false.
     */
    private boolean enabled = false;

    /**
     * Default development password for seeded demo accounts.
     * Can be overridden via DEMO_USER_PASSWORD environment variable.
     */
    private String defaultPassword = "DemoPassword123!";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getDefaultPassword() {
        return defaultPassword;
    }

    public void setDefaultPassword(String defaultPassword) {
        this.defaultPassword = defaultPassword;
    }
}
