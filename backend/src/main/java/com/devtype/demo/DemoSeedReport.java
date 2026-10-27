package com.devtype.demo;

/**
 * Sanitized operational summary report generated following demo data seeding.
 * Strictly excludes credentials, plaintext passwords, and private hashes.
 */
public record DemoSeedReport(
        int usersCreated,
        int usersSkipped,
        int templatesCreated,
        int templatesSkipped,
        int achievementsCreated,
        int achievementsSkipped,
        int srsCardsCreated,
        int srsCardsSkipped,
        int sessionsCreated,
        int activityRecordsCreated,
        int userAchievementsCreated
) {
    public boolean hasAnyCreated() {
        return (usersCreated + templatesCreated + achievementsCreated + srsCardsCreated
                + sessionsCreated + activityRecordsCreated + userAchievementsCreated) > 0;
    }
}
