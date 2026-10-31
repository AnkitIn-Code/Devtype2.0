package com.devtype.leaderboard.service;

import com.devtype.auth.security.SecurityUtils;
import com.devtype.leaderboard.RankedSeason;
import com.devtype.leaderboard.RankedSeasonRepository;
import com.devtype.leaderboard.UserSeasonRating;
import com.devtype.leaderboard.UserSeasonRatingRepository;
import com.devtype.leaderboard.dto.LeaderboardEntryResponse;
import com.devtype.leaderboard.dto.SeasonInfoResponse;
import com.devtype.leaderboard.dto.UserRankResponse;
import com.devtype.user.User;
import com.devtype.user.UserRepository;
import com.devtype.user.UserStatus;
import com.devtype.common.exception.ResourceNotFoundException;
import com.devtype.leaderboard.dto.MatchHistoryResponse;
import com.devtype.leaderboard.dto.MatchRecordResult;
import com.devtype.leaderboard.dto.RecordRankedMatchRequest;
import com.devtype.practice.PracticeSession;
import com.devtype.practice.PracticeSessionRepository;
import com.devtype.practice.PracticeSessionStatus;
import com.devtype.xp.dto.XpAwardResult;
import com.devtype.xp.service.XpService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service managing authoritative competitive leaderboard rankings,
 * active season state, BGMI tier progressions, and season end resets.
 */
@Service
public class LeaderboardService {

    private static final Logger log = LoggerFactory.getLogger(LeaderboardService.class);

    private final RankedSeasonRepository rankedSeasonRepository;
    private final UserSeasonRatingRepository userSeasonRatingRepository;
    private final UserRepository userRepository;
    private final BgmiTierService bgmiTierService;
    private final PracticeSessionRepository practiceSessionRepository;
    private final XpService xpService;
    private final org.springframework.jdbc.core.JdbcTemplate db;
    private final com.fasterxml.jackson.databind.ObjectMapper json;

    public LeaderboardService(
            RankedSeasonRepository rankedSeasonRepository,
            UserSeasonRatingRepository userSeasonRatingRepository,
            UserRepository userRepository,
            BgmiTierService bgmiTierService,
            PracticeSessionRepository practiceSessionRepository,
            XpService xpService,
            org.springframework.jdbc.core.JdbcTemplate db,
            com.fasterxml.jackson.databind.ObjectMapper json
    ) {
        this.rankedSeasonRepository = rankedSeasonRepository;
        this.userSeasonRatingRepository = userSeasonRatingRepository;
        this.userRepository = userRepository;
        this.bgmiTierService = bgmiTierService;
        this.practiceSessionRepository = practiceSessionRepository;
        this.xpService = xpService;
        this.db = db; this.json = json;
    }

    /**
     * Retrieves the authoritative leaderboard for the active season.
     */
    @Transactional
    public List<LeaderboardEntryResponse> getLeaderboard(String tierFilter) {
        lock();
        RankedSeason activeSeason = getOrCreateActiveSeason();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        try {
            db.update(
                "INSERT INTO user_season_ratings (user_id, season_id, rating, peak_rating, tier, matches_played, wins, losses, created_at) " +
                "SELECT u.id, ?, 1200, 1200, 'Bronze V', 0, 0, 0, CURRENT_TIMESTAMP " +
                "FROM app_users u " +
                "WHERE u.status = 'ACTIVE' " +
                "ON CONFLICT (user_id, season_id) DO NOTHING",
                activeSeason.getId()
            );
        } catch (Exception e) {
            log.warn("Auto-population of default ratings skipped: {}", e.getMessage());
        }
        List<UserSeasonRating> ratings = userSeasonRatingRepository.findLeaderboardBySeasonId(activeSeason.getId());
        List<LeaderboardEntryResponse> entries = new ArrayList<>();

        Map<Long, Integer> lastPointsByUser = new HashMap<>();
        try {
            List<Map<String, Object>> latestDeltas = db.queryForList(
                "SELECT r.user_id, (r.new_rating - r.old_rating) AS last_delta " +
                "FROM multiplayer_results r " +
                "JOIN (" +
                "    SELECT user_id, MAX(completed_at) AS max_completed " +
                "    FROM multiplayer_results " +
                "    GROUP BY user_id" +
                ") latest ON r.user_id = latest.user_id AND r.completed_at = latest.max_completed"
            );
            for (Map<String, Object> row : latestDeltas) {
                Long uid = ((Number) row.get("user_id")).longValue();
                Integer delta = row.get("last_delta") != null ? ((Number) row.get("last_delta")).intValue() : null;
                lastPointsByUser.put(uid, delta);
            }
        } catch (Exception e) {
            log.warn("Failed to fetch latest match points for leaderboard: {}", e.getMessage());
        }

        int currentRank = 1;
        for (UserSeasonRating r : ratings) {
            User user = r.getUser();
            if (user == null || user.getStatus() != UserStatus.ACTIVE) {
                continue;
            }

            int ordinalRank = currentRank++;
            String tierName = bgmiTierService.competitiveTier(r.getRating(), ordinalRank, r.getMatchesPlayed());
            r.setTier(tierName);
            // Optional tier filter (e.g. "Crown", "Diamond", "Gold", etc.)
            if (tierFilter != null && !tierFilter.isBlank() && !"all".equalsIgnoreCase(tierFilter)) {
                String group = bgmiTierService.getTierForRating(r.getRating()).groupName();
                if (!group.equalsIgnoreCase(tierFilter) && !tierName.equalsIgnoreCase(tierFilter)) {
                    continue;
                }
            }

            int matches = r.getMatchesPlayed() != null ? r.getMatchesPlayed() : 0;
            int wins = r.getWins() != null ? r.getWins() : 0;
            int losses = r.getLosses() != null ? r.getLosses() : 0;
            int winRate = matches > 0 ? (int) Math.round(((double) wins / matches) * 100) : 0;
            boolean isCurrentUser = currentUserId != null && currentUserId.equals(user.getId());

            String avatar = extractAvatarInitials(user.getDisplayName(), user.getUsername());
            String avatarBg = generateAvatarGradient(user.getId());

            entries.add(new LeaderboardEntryResponse(
                    user.getId(),
                    ordinalRank,
                    user.getDisplayName(),
                    user.getUsername(),
                    avatar,
                    avatarBg,
                    r.getRating(),
                    tierName,
                    r.getPeakRating(),
                    wins,
                    losses,
                    matches,
                    winRate,
                    isCurrentUser,
                    lastPointsByUser.get(user.getId())
            ));
        }

        return entries;
    }

    /**
     * Retrieves metadata for the active season, active competitors, and last season's champion.
     */
    @Transactional(readOnly = true)
    public SeasonInfoResponse getSeasonInfo() {
        RankedSeason activeSeason = getOrCreateActiveSeason();

        long daysRemaining = 0;
        if (activeSeason.getEndsAt() != null) {
            long days = (long) Math.ceil(java.time.Duration.between(Instant.now(), activeSeason.getEndsAt()).toMillis() / 86400000.0);
            daysRemaining = Math.max(0, days);
        }

        long activeCompetitors = userSeasonRatingRepository.countActiveCompetitorsBySeasonId(activeSeason.getId());
        if (activeCompetitors == 0) {
            activeCompetitors = userRepository.countByStatus(UserStatus.ACTIVE);
        }

        // Find previous ended season to display last season champion
        Optional<RankedSeason> previousSeasonOpt = rankedSeasonRepository.findBySeasonNumber(activeSeason.getSeasonNumber() - 1);
        String champName = null;
        String champUsername = null;
        Integer champRating = null;
        Integer champSeasonNum = null;

        if (previousSeasonOpt.isPresent()) {
            RankedSeason prev = previousSeasonOpt.get();
            champName = prev.getChampionName();
            champUsername = prev.getChampionUsername();
            champRating = prev.getChampionRating();
            champSeasonNum = prev.getSeasonNumber();
        } else if (activeSeason.getChampionName() != null) {
            champName = activeSeason.getChampionName();
            champUsername = activeSeason.getChampionUsername();
            champRating = activeSeason.getChampionRating();
            champSeasonNum = activeSeason.getSeasonNumber() - 1;
        }

        return new SeasonInfoResponse(
                activeSeason.getSeasonNumber(),
                activeSeason.getSeasonName(),
                activeSeason.getStatus(),
                activeSeason.getStartsAt(),
                activeSeason.getEndsAt(),
                daysRemaining,
                activeCompetitors,
                champName,
                champUsername,
                champRating,
                champSeasonNum
        );
    }

    /**
     * Retrieves the current authenticated user's tier, rank, and projected season reset.
     */
    @Transactional
    public UserRankResponse getUserRank() {
        lock();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        RankedSeason activeSeason = getOrCreateActiveSeason();

        long daysRemaining = 0;
        if (activeSeason.getEndsAt() != null) {
            long days = (long) Math.ceil(java.time.Duration.between(Instant.now(), activeSeason.getEndsAt()).toMillis() / 86400000.0);
            daysRemaining = Math.max(0, days);
        }

        if (currentUserId == null) {
            // Unauthenticated guest preview
            BgmiTierService.ResetProjection reset = bgmiTierService.calculateSeasonReset("Bronze V", 1200);
            return new UserRankResponse(
                    0, bgmiTierService.getTierForRating(1200).name(), 1200, 1200, 0, 0, 0, 0,
                    bgmiTierService.getPointsToNextTier(1200),
                    bgmiTierService.getNextTierName(1200),
                    reset.startingTierNextSeason(),
                    reset.startingRatingNextSeason(),
                    daysRemaining,
                    activeSeason.getSeasonNumber(),
                    activeSeason.getSeasonName()
            );
        }

        User user = userRepository.findById(currentUserId).orElse(null);
        if (user == null) {
            BgmiTierService.ResetProjection reset = bgmiTierService.calculateSeasonReset("Bronze V", 1200);
            return new UserRankResponse(0, bgmiTierService.getTierForRating(1200).name(), 1200, 1200, 0, 0, 0, 0, 0, "Bronze IV", reset.startingTierNextSeason(), reset.startingRatingNextSeason(), daysRemaining, activeSeason.getSeasonNumber(), activeSeason.getSeasonName());
        }

        UserSeasonRating rating = userSeasonRatingRepository.findByUserIdAndSeasonId(user.getId(), activeSeason.getId())
                .orElseGet(() -> {
                    UserSeasonRating initial = new UserSeasonRating(user, activeSeason, 1200, bgmiTierService.getTierForRating(1200).name());
                    return userSeasonRatingRepository.save(initial);
                });

        long playersAhead = playersAhead(activeSeason.getId(), rating.getUser().getId());
        long userRank = playersAhead + 1;

        int matches = rating.getMatchesPlayed() != null ? rating.getMatchesPlayed() : 0;
        int wins = rating.getWins() != null ? rating.getWins() : 0;
        int losses = rating.getLosses() != null ? rating.getLosses() : 0;
        int winRate = matches > 0 ? (int) Math.round(((double) wins / matches) * 100) : 0;

        BgmiTierService.ResetProjection reset = bgmiTierService.calculateSeasonReset(rating.getTier(), rating.getRating());

        return new UserRankResponse(
                userRank,
                bgmiTierService.competitiveTier(rating.getRating(), userRank, matches),
                rating.getRating(),
                rating.getPeakRating(),
                wins,
                losses,
                matches,
                winRate,
                bgmiTierService.getPointsToNextTier(rating.getRating()),
                bgmiTierService.getNextTierName(rating.getRating()),
                reset.startingTierNextSeason(),
                reset.startingRatingNextSeason(),
                daysRemaining,
                activeSeason.getSeasonNumber(),
                activeSeason.getSeasonName()
        );
    }

    /**
     * Executes the end-of-season rollover:
     * 1. Marks current season as ENDED and archives champion.
     * 2. Retains historical standings and records a unique finalization audit entry.
     * 3. Creates new season (current + 1).
     * 4. Drops all users' tiers and ratings based on the BGMI tier downgrade rules.
     */
    @Transactional
    public SeasonInfoResponse endSeasonAndResetTiers() {
        lock();
        RankedSeason activeSeason = getOrCreateActiveSeason();
        if (activeSeason.getEndsAt().isAfter(Instant.now())) return getSeasonInfo();
        int activeSeasonNum = activeSeason.getSeasonNumber();

        // 1. Determine Champion
        List<UserSeasonRating> leaderboard = userSeasonRatingRepository.findLeaderboardBySeasonId(activeSeason.getId());
        if (!leaderboard.isEmpty()) {
            UserSeasonRating top = leaderboard.get(0);
            activeSeason.setChampionUser(top.getUser());
            activeSeason.setChampionName(top.getUser().getDisplayName());
            activeSeason.setChampionUsername(top.getUser().getUsername());
            activeSeason.setChampionRating(top.getRating());
        }
        activeSeason.setStatus("ENDED");

        rankedSeasonRepository.save(activeSeason);

        // 2. Historical standings remain in their original season.
        // Preserve immutable historical season standings; never delete previous seasons.

        // 3. Create New Season
        Instant newStarts = activeSeason.getEndsAt();
        Instant newEnds = newStarts.plus(30, ChronoUnit.DAYS);
        RankedSeason nextSeason = new RankedSeason(activeSeasonNum + 1, "Season " + (activeSeasonNum + 1) + ": Ascendant", newStarts, newEnds);
        nextSeason = rankedSeasonRepository.save(nextSeason);

        // 4. Reset User Tiers and Ratings for the new season
        List<User> allUsers = userRepository.findByStatus(UserStatus.ACTIVE);
        for (User user : allUsers) {
            Optional<UserSeasonRating> oldRatingOpt = userSeasonRatingRepository.findByUserIdAndSeasonId(user.getId(), activeSeason.getId());
            int oldRating = oldRatingOpt.map(UserSeasonRating::getRating).orElse(1200);
            String oldTier = oldRatingOpt.map(UserSeasonRating::getTier).orElse("Bronze V");

            BgmiTierService.ResetProjection reset = bgmiTierService.calculateSeasonReset(oldTier, oldRating);

            UserSeasonRating newRating = new UserSeasonRating();
            newRating.setUser(user);
            newRating.setSeason(nextSeason);
            newRating.setRating(reset.startingRatingNextSeason());
            newRating.setPeakRating(reset.startingRatingNextSeason());
            newRating.setTier(reset.startingTierNextSeason());
            newRating.setPreviousSeasonTier(oldTier);
            newRating.setWins(0);
            newRating.setLosses(0);
            newRating.setMatchesPlayed(0);
            newRating.setCreatedAt(Instant.now());
            userSeasonRatingRepository.save(newRating);
        }

        db.update("INSERT INTO ranked_season_events(season_id,next_season_id,reset_users) VALUES(?,?,?)",activeSeason.getId(),nextSeason.getId(),allUsers.size());
        log.info("Successfully completed season {} rollover to season {}. Historical standings retained.", activeSeasonNum, nextSeason.getSeasonNumber());
        return getSeasonInfo();
    }

    private void lock() { db.queryForObject("SELECT id FROM multiplayer_lock WHERE id=1 FOR UPDATE", Integer.class); }

    private long playersAhead(Long seasonId, Long userId) {
        List<UserSeasonRating> ordered = userSeasonRatingRepository.findLeaderboardBySeasonId(seasonId);
        for (int i = 0; i < ordered.size(); i++) if (ordered.get(i).getUser().getId().equals(userId)) return i;
        return 0;
    }

    private RankedSeason getOrCreateActiveSeason() {
        return rankedSeasonRepository.findByStatus("ACTIVE").orElseThrow(() ->
            new com.devtype.common.exception.ApiException("No active ranked season is configured.", org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE));
    }

    private String extractAvatarInitials(String displayName, String username) {
        String base = (displayName != null && !displayName.isBlank()) ? displayName : username;
        if (base == null || base.isBlank()) return "DV";
        String[] parts = base.trim().split("\\s+");
        if (parts.length >= 2) {
            return ("" + parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return base.substring(0, Math.min(2, base.length())).toUpperCase();
    }

    private String generateAvatarGradient(Long id) {
        String[] gradients = {
                "linear-gradient(135deg, #1E3A8A, #3B82F6)",
                "linear-gradient(135deg, #065F46, #10B981)",
                "linear-gradient(135deg, #312E81, #4F46E5)",
                "linear-gradient(135deg, #78350F, #D97706)",
                "linear-gradient(135deg, #831843, #EC4899)",
                "linear-gradient(135deg, #1E293B, #475569)"
        };
        int idx = (int) (Math.abs(id != null ? id : 0) % gradients.length);
        return gradients[idx];
    }

    /**
     * Records an authoritative ranked multiplayer duel or race match in the PostgreSQL database:
     * 1. Updates UserSeasonRating (rating, peakRating, wins, losses, matchesPlayed, tier).
     * 2. Creates a PracticeSession for verified history and analytics.
     * 3. Awards XP to the user.
     * 4. Returns the updated UserRankResponse and MatchHistoryResponse.
     */
    @Transactional
    public MatchRecordResult recordMatch(Long userId, RecordRankedMatchRequest request) {
        throw new com.devtype.common.exception.ApiException("Ranked results are finalized by the race server only.", org.springframework.http.HttpStatus.FORBIDDEN);
    }

    @Transactional(readOnly = true)
    public List<MatchHistoryResponse> getUserMatchHistory(Long userId) {
        if (userId == null) return List.of();
        return db.query("SELECT r.snapshot, x.placement, x.new_rating, x.old_rating, x.elapsed_ms, x.completed_at FROM multiplayer_results x JOIN multiplayer_rooms r ON r.id=x.room_id WHERE x.user_id=? ORDER BY x.completed_at DESC, r.id LIMIT 30", (row, index) -> {
            try {
                com.devtype.multiplayer.RaceRoom room=json.readValue(row.getString("snapshot"),com.devtype.multiplayer.RaceRoom.class);
                var player=room.players.stream().filter(p->p.id==userId).findFirst().orElseThrow();
                long elapsed=row.getLong("elapsed_ms");
                int wpm=elapsed>0?(int)Math.round(room.target.codePointCount(0,room.target.length())*12000.0/elapsed):0;
                return new MatchHistoryResponse(room.id,room.mode,row.getTimestamp("completed_at").toInstant().toString(),room.title,room.language,
                    row.getInt("placement"),room.players.size(),wpm,player.finishedAt>0?100:player.progress,0,
                    room.players.stream().filter(p->p.id!=userId).map(p->p.name).toList(),player.delta>0,row.getInt("new_rating")-row.getInt("old_rating"),row.getInt("new_rating"));
            } catch(com.fasterxml.jackson.core.JsonProcessingException e) { throw new IllegalStateException("Invalid match history",e); }
        },userId);
    }
}
