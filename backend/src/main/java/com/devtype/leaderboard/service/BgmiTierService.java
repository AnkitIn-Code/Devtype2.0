package com.devtype.leaderboard.service;

import org.springframework.stereotype.Service;

/**
 * Service providing authoritative BGMI-style tier evaluations,
 * rating thresholds, progression math, and end-of-season rank reduction rules.
 */
@Service
public class BgmiTierService {
    @org.springframework.beans.factory.annotation.Value("${devtype.ranked.conqueror-positions:500}")
    private int conquerorPositions = 500;

    public String competitiveTier(int rating, long ordinalRank, int matchesPlayed) {
        return rating >= 4200 && ordinalRank > 0 && ordinalRank <= conquerorPositions && matchesPlayed > 0
            ? "Conqueror" : getTierForRating(rating).name();
    }


    public java.util.Map<String,Object> configuration() {
        var resets = java.util.Arrays.stream(TIERS).map(t -> {
            var reset = calculateSeasonReset(t.name(), t.minRating());
            return java.util.Map.of("targetTier",t.name(),"startingNextSeason",reset.startingTierNextSeason(),"startingRating",reset.startingRatingNextSeason());
        }).toList();
        java.util.List<Object> resetRows = new java.util.ArrayList<>(resets);
        resetRows.add(0, java.util.Map.of("targetTier","Conqueror","startingNextSeason","Platinum III","startingRating",2700));
        return java.util.Map.of("tiers", TIERS, "resetRules", resetRows, "conquerorPositions", conquerorPositions,
            "conquerorMinimumRating",4200,"conquerorResetRating",2700);
    }

    public record TierInfo(
            String name,
            String groupName,
            int minRating,
            int maxRating,
            String color,
            String icon
    ) {}

    public static final TierInfo[] TIERS = new TierInfo[] {
            new TierInfo("Bronze V",     "Bronze",   1000, 1099, "#CD7F32", "🥉"),
            new TierInfo("Bronze IV",    "Bronze",   1100, 1199, "#CD7F32", "🥉"),
            new TierInfo("Bronze III",   "Bronze",   1200, 1299, "#CD7F32", "🥉"),
            new TierInfo("Bronze II",    "Bronze",   1300, 1399, "#CD7F32", "🥉"),
            new TierInfo("Bronze I",     "Bronze",   1400, 1499, "#CD7F32", "🥉"),

            new TierInfo("Silver V",     "Silver",   1500, 1599, "#94A3B8", "🛡️"),
            new TierInfo("Silver IV",    "Silver",   1600, 1699, "#94A3B8", "🛡️"),
            new TierInfo("Silver III",   "Silver",   1700, 1799, "#94A3B8", "🛡️"),
            new TierInfo("Silver II",    "Silver",   1800, 1899, "#94A3B8", "🛡️"),
            new TierInfo("Silver I",     "Silver",   1900, 1999, "#94A3B8", "🛡️"),

            new TierInfo("Gold V",       "Gold",     2000, 2099, "#EAB308", "🏅"),
            new TierInfo("Gold IV",      "Gold",     2100, 2199, "#EAB308", "🏅"),
            new TierInfo("Gold III",     "Gold",     2200, 2299, "#EAB308", "🏅"),
            new TierInfo("Gold II",      "Gold",     2300, 2399, "#EAB308", "🏅"),
            new TierInfo("Gold I",       "Gold",     2400, 2499, "#EAB308", "🏅"),

            new TierInfo("Platinum V",   "Platinum", 2500, 2599, "#38BDF8", "🎖️"),
            new TierInfo("Platinum IV",  "Platinum", 2600, 2699, "#38BDF8", "🎖️"),
            new TierInfo("Platinum III", "Platinum", 2700, 2799, "#38BDF8", "🎖️"),
            new TierInfo("Platinum II",  "Platinum", 2800, 2899, "#38BDF8", "🎖️"),
            new TierInfo("Platinum I",   "Platinum", 2900, 2999, "#38BDF8", "🎖️"),

            new TierInfo("Diamond V",    "Diamond",  3000, 3099, "#06B6D4", "💎"),
            new TierInfo("Diamond IV",   "Diamond",  3100, 3199, "#06B6D4", "💎"),
            new TierInfo("Diamond III",  "Diamond",  3200, 3299, "#06B6D4", "💎"),
            new TierInfo("Diamond II",   "Diamond",  3300, 3399, "#06B6D4", "💎"),
            new TierInfo("Diamond I",    "Diamond",  3400, 3499, "#06B6D4", "💎"),

            new TierInfo("Crown V",      "Crown",    3500, 3599, "#A855F7", "👑"),
            new TierInfo("Crown IV",     "Crown",    3600, 3699, "#A855F7", "👑"),
            new TierInfo("Crown III",    "Crown",    3700, 3799, "#A855F7", "👑"),
            new TierInfo("Crown II",     "Crown",    3800, 3899, "#A855F7", "👑"),
            new TierInfo("Crown I",      "Crown",    3900, 4199, "#A855F7", "👑"),

            new TierInfo("Ace",          "Ace",      4200, 4699, "#F43F5E", "🔥"),
            new TierInfo("Ace Master",   "Ace",      4700, 5199, "#E11D48", "⚡"),
            new TierInfo("Ace Dominator","Ace",      5200, 99999, "#BE123C", "🔱")
    };

    /**
     * Resolves the appropriate BGMI tier corresponding to the user's rating.
     */
    public TierInfo getTierForRating(int rating) {
        if (rating < 1000) {
            return TIERS[0];
        }
        for (int i = TIERS.length - 1; i >= 0; i--) {
            if (rating >= TIERS[i].minRating) {
                return TIERS[i];
            }
        }
        return TIERS[0];
    }

    /**
     * Calculates points needed to reach the next tier/sub-tier.
     */
    public int getPointsToNextTier(int rating) {
        TierInfo current = getTierForRating(rating);
        if (current.maxRating >= 99999) return 0;
        return Math.max(0, (current.maxRating + 1) - rating);
    }

    /**
     * Returns the name of the immediate next tier.
     */
    public String getNextTierName(int rating) {
        if (rating < 1000) return "Bronze IV";
        for (int i = 0; i < TIERS.length - 1; i++) {
            if (rating >= TIERS[i].minRating && rating <= TIERS[i].maxRating) {
                return TIERS[i + 1].name;
            }
        }
        return "Max Tier Achieved";
    }

    /**
     * BGMI Season End Tier Reduction calculation.
     * Matches the exact rules in the attached user reference image:
     * - Ace / Crown I -> Platinum III
     * - Crown II - Crown III -> Platinum IV
     * - Crown IV - Crown V -> Platinum V
     * - Diamond I - Diamond II -> Gold I
     * - Diamond III - Diamond V -> Gold II
     * - Platinum -> Gold IV - Gold V
     * - Gold -> Gold V
     * - Silver -> Silver
     * - Bronze -> Bronze
     */
    public ResetProjection calculateSeasonReset(String currentTierName, int currentRating) {
        if (currentTierName == null || currentTierName.isBlank()) {
            currentTierName = getTierForRating(currentRating).name;
        }

        String targetStartingTier;
        int targetStartingRating;

        if (currentTierName.equals("Conqueror") || currentTierName.startsWith("Ace") || "Crown I".equalsIgnoreCase(currentTierName)) {
            targetStartingTier = "Platinum III";
            targetStartingRating = 2700;
        } else if ("Crown II".equalsIgnoreCase(currentTierName) || "Crown III".equalsIgnoreCase(currentTierName)) {
            targetStartingTier = "Platinum IV";
            targetStartingRating = 2600;
        } else if ("Crown IV".equalsIgnoreCase(currentTierName) || "Crown V".equalsIgnoreCase(currentTierName)) {
            targetStartingTier = "Platinum V";
            targetStartingRating = 2500;
        } else if ("Diamond I".equalsIgnoreCase(currentTierName) || "Diamond II".equalsIgnoreCase(currentTierName)) {
            targetStartingTier = "Gold I";
            targetStartingRating = 2400;
        } else if (currentTierName.startsWith("Diamond")) { // Diamond III, IV, V
            targetStartingTier = "Gold II";
            targetStartingRating = 2300;
        } else if (currentTierName.startsWith("Platinum")) { // Platinum I to V
            targetStartingTier = "Gold IV";
            targetStartingRating = 2100;
        } else if (currentTierName.startsWith("Gold")) {
            targetStartingTier = "Gold V";
            targetStartingRating = 2000;
        } else if (currentTierName.startsWith("Silver")) {
            targetStartingTier = currentTierName;
            targetStartingRating = Math.min(currentRating, 1600);
        } else {
            targetStartingTier = "Bronze V";
            targetStartingRating = 1200;
        }

        // Keep the configured numerical reset baselines; derive labels from the same tier table.
        return new ResetProjection(currentTierName, getTierForRating(targetStartingRating).name(), targetStartingRating);
    }

    public record ResetProjection(
            String currentTier,
            String startingTierNextSeason,
            int startingRatingNextSeason
    ) {}
}
