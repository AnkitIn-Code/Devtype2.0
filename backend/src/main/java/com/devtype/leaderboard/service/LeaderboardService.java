package com.devtype.leaderboard.service;

import com.devtype.auth.security.SecurityUtils;
import com.devtype.leaderboard.dto.LeaderboardEntryResponse;
import com.devtype.practice.PracticeSessionRepository;
import com.devtype.practice.PracticeSessionStatus;
import com.devtype.user.User;
import com.devtype.user.UserRepository;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;
import com.devtype.xp.XpTransactionRepository;
import com.devtype.xp.service.XpService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.devtype.xp.service.LevelProgressionService;

/**
 * Service calculating authentic developer leaderboard rankings across timeframes and metrics.
 */
@Service
public class LeaderboardService {

    private final UserRepository userRepository;
    private final PracticeSessionRepository practiceSessionRepository;
    private final XpTransactionRepository xpTransactionRepository;
    private final LevelProgressionService levelProgressionService;

    public LeaderboardService(
            UserRepository userRepository,
            PracticeSessionRepository practiceSessionRepository,
            XpTransactionRepository xpTransactionRepository,
            LevelProgressionService levelProgressionService
    ) {
        this.userRepository = userRepository;
        this.practiceSessionRepository = practiceSessionRepository;
        this.xpTransactionRepository = xpTransactionRepository;
        this.levelProgressionService = levelProgressionService;
    }

    /**
     * Computes the real platform leaderboard for the given timeframe and metric.
     *
     * @param timeframe "today" | "thisWeek" | "thisMonth" | "allTime"
     * @param metric "wpm" | "xp"
     * @return Ordered list of ranked developers
     */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryResponse> getLeaderboard(String timeframe, String metric) {
        Instant since = resolveTimeframeCutoff(timeframe);
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        // Fetch aggregated session performance
        Map<Long, PracticeSessionRepository.UserPerformanceRow> perfMap = new HashMap<>();
        List<PracticeSessionRepository.UserPerformanceRow> perfRows = (since != null)
                ? practiceSessionRepository.getLeaderboardStatsSince(PracticeSessionStatus.COMPLETED, since)
                : practiceSessionRepository.getAllTimeLeaderboardStats(PracticeSessionStatus.COMPLETED);

        for (PracticeSessionRepository.UserPerformanceRow row : perfRows) {
            perfMap.put(row.getUserId(), row);
        }

        // Fetch aggregated XP transactions for timeframe
        Map<Long, Long> xpMap = new HashMap<>();
        if (since != null) {
            List<XpTransactionRepository.UserXpRow> xpRows = xpTransactionRepository.getXpTotalsSince(since);
            for (XpTransactionRepository.UserXpRow row : xpRows) {
                xpMap.put(row.getUserId(), row.getTotalXp());
            }
        }

        // Fetch active platform users
        List<User> activeUsers = userRepository.findByStatus(UserStatus.ACTIVE);
        List<LeaderboardEntryResponse> entries = new ArrayList<>();

        for (User user : activeUsers) {
            Long uid = user.getId();
            PracticeSessionRepository.UserPerformanceRow perf = perfMap.get(uid);

            int wpm = perf != null && perf.getBestNetWpm() != null ? perf.getBestNetWpm().intValue() : 0;
            double accuracy = perf != null && perf.getAvgAccuracy() != null ? Math.round(perf.getAvgAccuracy() * 10.0) / 10.0 : 0.0;
            long sessions = perf != null && perf.getSessions() != null ? perf.getSessions() : 0L;
            long xp = (since != null) ? xpMap.getOrDefault(uid, 0L) : user.getTotalXp();
            int level = levelProgressionService.calculateProgression(user.getTotalXp()).currentLevel();

            boolean isCurrentUser = currentUserId != null && currentUserId.equals(uid);
            String title = user.getRole() == UserRole.ADMIN ? "Platform Administrator" : "Software Developer";
            String avatar = extractAvatarInitials(user.getDisplayName(), user.getUsername());
            String avatarBg = generateAvatarGradient(uid);

            entries.add(new LeaderboardEntryResponse(
                    uid,
                    0, // Assigned after sorting
                    user.getUsername(),
                    user.getDisplayName(),
                    avatar,
                    avatarBg,
                    level,
                    title,
                    "Code",
                    wpm,
                    xp,
                    accuracy,
                    sessions,
                    0, // streak info
                    isCurrentUser,
                    false
            ));
        }

        // Sort entries by requested metric descending
        boolean sortByXp = "xp".equalsIgnoreCase(metric);
        entries.sort((a, b) -> {
            if (sortByXp) {
                int cmp = Long.compare(b.xp(), a.xp());
                if (cmp != 0) return cmp;
                return Integer.compare(b.wpm(), a.wpm());
            } else {
                int cmp = Integer.compare(b.wpm(), a.wpm());
                if (cmp != 0) return cmp;
                return Long.compare(b.xp(), a.xp());
            }
        });

        // Reassign rank position 1..N
        List<LeaderboardEntryResponse> ranked = new ArrayList<>(entries.size());
        for (int i = 0; i < entries.size(); i++) {
            LeaderboardEntryResponse e = entries.get(i);
            ranked.add(new LeaderboardEntryResponse(
                    e.id(),
                    i + 1,
                    e.name(),
                    e.displayName(),
                    e.avatar(),
                    e.avatarBg(),
                    e.level(),
                    e.title(),
                    e.primaryLang(),
                    e.wpm(),
                    e.xp(),
                    e.accuracy(),
                    e.sessions(),
                    e.streak(),
                    e.isCurrentUser(),
                    e.isFriend()
            ));
        }

        return ranked;
    }

    private Instant resolveTimeframeCutoff(String timeframe) {
        if ("today".equalsIgnoreCase(timeframe)) {
            return LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
        } else if ("thisWeek".equalsIgnoreCase(timeframe)) {
            return Instant.now().minus(7, ChronoUnit.DAYS);
        } else if ("thisMonth".equalsIgnoreCase(timeframe)) {
            return Instant.now().minus(30, ChronoUnit.DAYS);
        }
        return null; // allTime
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
}
