package com.devtype.srs.service;

import com.devtype.common.exception.ResourceNotFoundException;
import com.devtype.srs.SrsCard;
import com.devtype.srs.SrsCardRepository;
import com.devtype.srs.dto.SrsCardResponse;
import com.devtype.srs.dto.SubmitSrsReviewRequest;
import com.devtype.user.User;
import com.devtype.user.UserRepository;
import com.devtype.xp.service.XpService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import com.devtype.achievement.service.AchievementService;
import java.util.List;

@Service
public class SrsService {

    private static final Logger log = LoggerFactory.getLogger(SrsService.class);

    private final SrsCardRepository srsCardRepository;
    private final UserRepository userRepository;
    private final XpService xpService;
    private final AchievementService achievementService;

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
                    return newCard;
                });

        if (request.snippetTitle() != null && !request.snippetTitle().isBlank()) {
            card.setSnippetTitle(request.snippetTitle());
        }
        if (request.language() != null && !request.language().isBlank()) {
            card.setLanguage(request.language());
        }

        int q = Math.max(0, Math.min(5, request.qualityScore()));
        int repetition = card.getRepetition();
        BigDecimal easeFactor = card.getEaseFactor();
        int intervalDays = card.getIntervalDays();

        // SM-2 Spaced Repetition calculation
        if (q >= 3) {
            if (repetition == 0) {
                intervalDays = 1;
            } else if (repetition == 1) {
                intervalDays = 6;
            } else {
                intervalDays = Math.max(1, (int) Math.round(intervalDays * easeFactor.doubleValue()));
            }
            repetition += 1;
        } else {
            repetition = 0;
            intervalDays = 1;
        }

        double efPrime = easeFactor.doubleValue() + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
        efPrime = Math.max(1.30, Math.round(efPrime * 100.0) / 100.0);
        easeFactor = BigDecimal.valueOf(efPrime).setScale(2, RoundingMode.HALF_UP);

        Instant now = Instant.now();
        Instant nextDueDate = now.plus(intervalDays, ChronoUnit.DAYS);

        card.setRepetition(repetition);
        card.setEaseFactor(easeFactor);
        card.setIntervalDays(intervalDays);
        card.setDueDate(nextDueDate);
        card.setLastReviewedAt(now);
        card.setLastQualityScore(q);

        SrsCard saved = srsCardRepository.save(card);
        log.info("Updated SRS card {} for user {}: repetition={}, intervalDays={}, nextDue={}",
                saved.getSnippetId(), user.getUsername(), repetition, intervalDays, nextDueDate);

        // Award SRS XP (50 XP standard, +25 bonus for mastery)
        int xpReward = q >= 4 ? 75 : 50;
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
