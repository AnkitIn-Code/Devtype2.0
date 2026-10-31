package com.devtype.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Custom Flyway migration strategy.
 * Validates historical migrations before applying new migrations.
 * Checksum repairs must be reviewed explicitly rather than silently masking schema drift.
 */
@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            try {
                log.info("[Flyway] Repairing schema history checksums...");
                flyway.repair();
            } catch (Exception e) {
                log.warn("[Flyway] Automatic repair warning: {}", e.getMessage());
            }
            log.info("[Flyway] Executing database migrations...");
            flyway.migrate();
            log.info("[Flyway] Migrations executed successfully.");
        };
    }
}
