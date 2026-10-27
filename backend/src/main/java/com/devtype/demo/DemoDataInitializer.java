package com.devtype.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Spring Boot ApplicationRunner that triggers demo data seeding upon application startup
 * when explicitly configured and allowed by environment profile policies.
 */
@Component
@Order(100)
public class DemoDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final DemoDataSeederService seederService;

    public DemoDataInitializer(DemoDataSeederService seederService) {
        this.seederService = seederService;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            seederService.seedIfEnabled();
        } catch (Exception e) {
            log.error("Fatal error during demo data initialization: {}", e.getMessage(), e);
            throw e;
        }
    }
}
