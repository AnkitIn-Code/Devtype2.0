package com.devtype.srs.service;

import com.devtype.common.exception.ResourceNotFoundException;
import com.devtype.srs.SrsCard;
import com.devtype.srs.SrsCardRepository;
import com.devtype.srs.dto.SrsCardResponse;
import com.devtype.srs.dto.SubmitSrsReviewRequest;
import com.devtype.template.PracticeTemplate;
import com.devtype.user.User;
import com.devtype.user.UserRepository;
import com.devtype.xp.service.XpService;
import com.devtype.achievement.service.AchievementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class SrsService {

    private static final Logger log = LoggerFactory.getLogger(SrsService.class);

    private final SrsCardRepository srsCardRepository;
    private final UserRepository userRepository;
    private final XpService xpService;
    private final AchievementService achievementService;

    public record SrsScheduleResult(
            int repetition,
            BigDecimal easeFactor,
            Integer intervalDays,
            boolean isMastered,
            Instant dueDate,
            int qualityScore
    ) {}

    public SrsService(
            SrsCardRepository srsCardRepository,
            UserRepository userRepository,
            XpService xpService,
            AchievementService achievementService) {
        this.srsCardRepository = srsCardRepository;
        this.userRepository = userRepository;
        this.xpService = xpService;
        this.achievementService = achievementService;
    }

    @Transactional(readOnly = true)
    public List<SrsCardResponse> getDueCards(Long userId) {
        Instant now = Instant.now();
        return srsCardRepository.findDueCardsByUserId(userId, now)
                .stream()
                .map(SrsCardResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SrsCardResponse> getDeck(Long userId) {
        return srsCardRepository.findByUserIdOrderByDueDateAsc(userId)
                .stream()
                .map(SrsCardResponse::fromEntity)
                .toList();
    }

    /**
     * Deterministic rule-based benchmark evaluation (No AI call):
     * Evaluates accuracy, error count, and net WPM to compute retention tier and recall schedule:
     * - Tier 4 (Mastered): Flawless recall (accuracy >= 98.5%, errors <= 1, speed >= 65 WPM).
     *   Card remains in Master Deck Registry without urgent recall queue deadline.
     * - Tier 3 (Proficient): Strong retention (accuracy >= 96.0%, errors <= 2, speed >= 40 WPM).
     *   Recall scheduled in 12 to 16 days.
     * - Tier 2 (Developing / "A little good"): Solid progress (accuracy >= 90.0%, errors <= 6, speed >= 25 WPM).
     *   Recall scheduled in 5 to 8 days.
     * - Tier 1 (Struggling / Bad performance): High errors or low accuracy/speed.
     *   Immediate recall scheduled in 1 to 2 days, enters Recall Action Queue on deadline.
     */
    public SrsScheduleResult evaluateBenchmarkMatrix(
            int currentRepetition,
            BigDecimal currentEaseFactor,
            int netWpm,
            double accuracy,
            int errorCount,
            Instant now
    ) {
        int speed = Math.max(0, netWpm);
        double acc = Math.max(0.0, Math.min(100.0, accuracy));
        int errors = Math.max(0, errorCount);

        int qualityScore;
        Integer interval;
        boolean isMastered;
        int nextRepetition;
        Instant nextDue;

        // Tier 4: Mastered (Flawless precision and high speed: retained in Master Deck)
        if (acc >= 98.5 && errors <= 1 && speed >= 65) {
            isMastered = true;
            interval = null;
            nextDue = null;
            nextRepetition = currentRepetition + 1;
            qualityScore = 5;
        }
        // Tier 3: Strong / High Accuracy (10 to 18 days recall)
        else if (acc >= 96.0 && errors <= 2 && speed >= 40) {
            isMastered = false;
            interval = speed >= 55 ? 16 : 12;
            nextDue = now.plus(interval, ChronoUnit.DAYS);
            nextRepetition = currentRepetition + 1;
            qualityScore = 4;
        }
        // Tier 2: Developing / "A little good" (5 to 8 days recall)
        else if (acc >= 90.0 && errors <= 6 && speed >= 25) {
            isMastered = false;
            if (acc >= 93.0 && errors <= 3 && speed >= 35) {
                interval = 8;
            } else {
                interval = 5;
            }
            nextDue = now.plus(interval, ChronoUnit.DAYS);
            nextRepetition = currentRepetition + 1;
            qualityScore = 3;
        }
        // Tier 1: Bad / Struggling Performance -> Immediate Recall (Due immediately in Recall Action Queue!)
        else {
            isMastered = false;
            if (acc < 80.0 || errors >= 10 || speed < 18) {
                interval = 1;
                qualityScore = 1;
            } else {
                interval = 2;
                qualityScore = 2;
            }
            // Due immediately so it appears directly in the Recall Action Queue for urgent remediation!
            nextDue = now;
            nextRepetition = 0; // Reset streak so user is prompted for rapid recall
        }

        // Updated ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        BigDecimal baseEf = currentEaseFactor != null ? currentEaseFactor : new BigDecimal("2.50");
        double efPrime = baseEf.doubleValue() + (0.1 - (5 - qualityScore) * (0.08 + (5 - qualityScore) * 0.02));
        efPrime = Math.max(1.30, Math.round(efPrime * 100.0) / 100.0);
        BigDecimal newEaseFactor = BigDecimal.valueOf(efPrime).setScale(2, RoundingMode.HALF_UP);

        return new SrsScheduleResult(nextRepetition, newEaseFactor, interval, isMastered, nextDue, qualityScore);
    }

    /**
     * Automatically called whenever ANY practice template is completed.
     * Evaluates the template against the benchmark matrix and adds/updates it in the user's SRS Master Deck.
     * Never applied to Custom Studio snippets.
     */
    @Transactional
    public SrsCardResponse recordTemplateSession(User user, PracticeTemplate template, int netWpm, double accuracy, int errorCount) {
        if (user == null || template == null) {
            return null;
        }

        String snippetId = template.getSlug() != null && !template.getSlug().isBlank()
                ? template.getSlug()
                : String.valueOf(template.getId());

        SrsCard card = srsCardRepository.findByUserIdAndSnippetId(user.getId(), snippetId)
                .orElseGet(() -> {
                    SrsCard newCard = new SrsCard();
                    newCard.setUser(user);
                    newCard.setSnippetId(snippetId);
                    newCard.setSnippetTitle(template.getTitle());
                    newCard.setLanguage(template.getLanguage() != null ? template.getLanguage() : "Code");
                    newCard.setRepetition(0);
                    newCard.setEaseFactor(new BigDecimal("2.50"));
                    newCard.setIntervalDays(1);
                    newCard.setDueDate(Instant.now());
                    newCard.setMastered(false);
                    return newCard;
                });

        card.setSnippetTitle(template.getTitle());
        if (template.getLanguage() != null) {
            card.setLanguage(template.getLanguage());
        }

        Instant now = Instant.now();
        SrsScheduleResult result = evaluateBenchmarkMatrix(
                card.getRepetition(),
                card.getEaseFactor(),
                netWpm,
                accuracy,
                errorCount,
                now
        );

        card.setRepetition(result.repetition());
        card.setEaseFactor(result.easeFactor());
        card.setIntervalDays(result.intervalDays());
        card.setMastered(result.isMastered());
        card.setDueDate(result.dueDate());
        card.setLastReviewedAt(now);
        card.setLastQualityScore(result.qualityScore());

        SrsCard saved = srsCardRepository.save(card);
        log.info("SRS Benchmark Evaluated for user {} on template '{}': wpm={}, acc={}% errors={} -> interval={}d, mastered={}, nextDue={}",
                user.getUsername(), template.getTitle(), netWpm, accuracy, errorCount, result.intervalDays(), result.isMastered(), result.dueDate());

        // Award SRS XP (50 XP standard, +25 bonus for mastery)
        int xpReward = (result.isMastered() || result.qualityScore() >= 4) ? 75 : 50;
        try {
            xpService.awardSrsXp(user, saved.getId(), xpReward, "SRS Recall: " + saved.getSnippetTitle());
        } catch (Exception e) {
            log.warn("Could not award SRS XP: {}", e.getMessage());
        }

        // Evaluate milestone achievements for SRS reviews
        try {
            achievementService.evaluateSrsAchievements(user);
        } catch (Exception e) {
            log.warn("Could not evaluate SRS achievements: {}", e.getMessage());
        }

        return SrsCardResponse.fromEntity(saved);
    }

    @Transactional
    public SrsCardResponse submitReview(Long userId, SubmitSrsReviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        SrsCard card = srsCardRepository.findByUserIdAndSnippetId(userId, request.snippetId())
                .orElseGet(() -> {
                    SrsCard newCard = new SrsCard();
                    newCard.setUser(user);
                    newCard.setSnippetId(request.snippetId());
                    newCard.setSnippetTitle(request.snippetTitle() != null ? request.snippetTitle() : request.snippetId());
                    newCard.setLanguage(request.language() != null ? request.language() : "Code");
                    newCard.setRepetition(0);
                    newCard.setEaseFactor(new BigDecimal("2.50"));
                    newCard.setIntervalDays(1);
                    newCard.setDueDate(Instant.now());
                    newCard.setMastered(false);
                    return newCard;
                });

        if (request.snippetTitle() != null && !request.snippetTitle().isBlank()) {
            card.setSnippetTitle(request.snippetTitle());
        }
        if (request.language() != null && !request.language().isBlank()) {
            card.setLanguage(request.language());
        }

        int speed = request.netWpm() != null ? Math.max(0, request.netWpm()) : 0;
        double accuracy = request.accuracy() != null ? request.accuracy() : (request.qualityScore() >= 4 ? 98.0 : (request.qualityScore() == 3 ? 92.0 : 80.0));
        int errorCount = request.errorCount() != null ? request.errorCount() : (accuracy < 90.0 ? 8 : (accuracy < 96.0 ? 4 : 1));

        Instant now = Instant.now();
        SrsScheduleResult result = evaluateBenchmarkMatrix(
                card.getRepetition(),
                card.getEaseFactor(),
                speed,
                accuracy,
                errorCount,
                now
        );

        card.setRepetition(result.repetition());
        card.setEaseFactor(result.easeFactor());
        card.setIntervalDays(result.intervalDays());
        card.setMastered(result.isMastered());
        card.setDueDate(result.dueDate());
        card.setLastReviewedAt(now);
        card.setLastQualityScore(result.qualityScore());

        SrsCard saved = srsCardRepository.save(card);
        log.info("Updated SRS card {} for user {}: repetition={}, intervalDays={}, mastered={}, nextDue={}",
                saved.getSnippetId(), user.getUsername(), result.repetition(), result.intervalDays(), result.isMastered(), result.dueDate());

        // Award SRS XP (50 XP standard, +25 bonus for mastery)
        int xpReward = (result.isMastered() || result.qualityScore() >= 4) ? 75 : 50;
        try {
            xpService.awardSrsXp(user, saved.getId(), xpReward, "SRS Recall: " + saved.getSnippetTitle());
        } catch (Exception e) {
            log.warn("Could not award SRS XP: {}", e.getMessage());
        }

        // Evaluate milestone achievements for SRS reviews
        try {
            achievementService.evaluateSrsAchievements(user);
        } catch (Exception e) {
            log.warn("Could not evaluate SRS achievements: {}", e.getMessage());
        }

        return SrsCardResponse.fromEntity(saved);
    }
}
