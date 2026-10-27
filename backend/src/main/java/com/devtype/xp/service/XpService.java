package com.devtype.xp.service;

import com.devtype.achievement.Achievement;
import com.devtype.practice.PracticeSession;
import com.devtype.practice.PracticeSessionStatus;
import com.devtype.user.User;
import com.devtype.user.UserRepository;
import com.devtype.xp.XpSourceType;
import com.devtype.xp.XpTransaction;
import com.devtype.xp.XpTransactionRepository;
import com.devtype.xp.dto.UserLevelProgression;
import com.devtype.xp.dto.XpAwardResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Centralized server-side authority for developer XP calculation, ledger persistence,
 * and duplicate-proof transactional rewards.
 */
@Service
public class XpService {

    private static final Logger log = LoggerFactory.getLogger(XpService.class);

    public static final int BASE_PRACTICE_XP = 50;
    public static final int BONUS_INTERMEDIATE_XP = 25;
    public static final int BONUS_ADVANCED_XP = 50;
    public static final int BONUS_ACCURACY_98_XP = 25;
    public static final int BONUS_ACCURACY_100_XP = 50;

    public static final int ACHIEVEMENT_DEFAULT_XP = 50;
    public static final int SRS_REVIEW_DEFAULT_XP = 50;

    private final XpTransactionRepository xpTransactionRepository;
    private final UserRepository userRepository;
    private final LevelProgressionService levelProgressionService;

    public XpService(
            XpTransactionRepository xpTransactionRepository,
            UserRepository userRepository,
            LevelProgressionService levelProgressionService) {
        this.xpTransactionRepository = xpTransactionRepository;
        this.userRepository = userRepository;
        this.levelProgressionService = levelProgressionService;
    }

    /**
     * Authoritatively awards XP for a successfully completed practice session.
     * Enforces idempotency via the (user_id, source_type, source_id) ledger constraint.
     */
    @Transactional
    public XpAwardResult awardPracticeSessionXp(PracticeSession session) {
        if (session == null || session.getStatus() != PracticeSessionStatus.COMPLETED || session.getUser() == null) {
            log.warn("Cannot award XP for non-completed or unowned practice session");
            return createZeroResult(session != null && session.getUser() != null ? session.getUser().getTotalXp() : 0L);
        }

        User user = session.getUser();
        String sourceId = String.valueOf(session.getId());

        // Fast idempotency check
        Optional<XpTransaction> existingTx = xpTransactionRepository.findByUserIdAndSourceTypeAndSourceId(
                user.getId(), XpSourceType.PRACTICE_SESSION, sourceId
        );
        if (existingTx.isPresent()) {
            UserLevelProgression prog = levelProgressionService.calculateProgression(user.getTotalXp());
            return new XpAwardResult(
                    existingTx.get().getAmount(),
                    user.getTotalXp(),
                    prog.currentLevel(),
                    prog.nextLevelThresholdXp(),
                    prog.progressPercent(),
                    false
            );
        }

        // Calculate award based on difficulty and accuracy
        int totalAward = calculatePracticeXpAmount(session);

        try {
            XpTransaction tx = new XpTransaction(
                    user,
                    XpSourceType.PRACTICE_SESSION,
                    sourceId,
                    totalAward,
                    "Practice: " + session.getTemplateTitleSnapshot()
            );
            xpTransactionRepository.saveAndFlush(tx);

            // Increment cached total_xp on user
            user.setTotalXp(user.getTotalXp() + totalAward);
            userRepository.save(user);

            UserLevelProgression prog = levelProgressionService.calculateProgression(user.getTotalXp());
            log.info("Awarded {} XP to user {} for practice session {}", totalAward, user.getUsername(), session.getId());
            return new XpAwardResult(
                    totalAward,
                    user.getTotalXp(),
                    prog.currentLevel(),
                    prog.nextLevelThresholdXp(),
                    prog.progressPercent(),
                    true
            );
        } catch (DataIntegrityViolationException ex) {
            // Concurrent submission caught by unique constraint
            log.warn("Duplicate XP award attempt blocked by unique constraint for session {}", session.getId());
            Optional<XpTransaction> tx = xpTransactionRepository.findByUserIdAndSourceTypeAndSourceId(
                    user.getId(), XpSourceType.PRACTICE_SESSION, sourceId
            );
            int existingAmt = tx.map(XpTransaction::getAmount).orElse(0);
            UserLevelProgression prog = levelProgressionService.calculateProgression(user.getTotalXp());
            return new XpAwardResult(
                    existingAmt,
                    user.getTotalXp(),
                    prog.currentLevel(),
                    prog.nextLevelThresholdXp(),
                    prog.progressPercent(),
                    false
            );
        }
    }

    /**
     * Authoritatively awards XP for completing an SRS active recall review.
     */
    @Transactional
    public XpAwardResult awardSrsXp(User user, Long srsCardId, int amount, String description) {
        if (user == null || srsCardId == null) {
            return createZeroResult(user != null ? user.getTotalXp() : 0L);
        }

        String sourceId = srsCardId + ":" + System.currentTimeMillis();

        try {
            XpTransaction tx = new XpTransaction(
                    user,
                    XpSourceType.SRS_REVIEW,
                    sourceId,
                    amount,
                    description != null ? description : "SRS Recall Review"
            );
            xpTransactionRepository.saveAndFlush(tx);

            user.setTotalXp(user.getTotalXp() + amount);
            userRepository.save(user);

            UserLevelProgression prog = levelProgressionService.calculateProgression(user.getTotalXp());
            log.info("Awarded {} XP to user {} for SRS review {}", amount, user.getUsername(), srsCardId);
            return new XpAwardResult(
                    amount,
                    user.getTotalXp(),
                    prog.currentLevel(),
                    prog.nextLevelThresholdXp(),
                    prog.progressPercent(),
                    true
            );
        } catch (DataIntegrityViolationException ex) {
            log.warn("Duplicate SRS XP award caught by unique constraint for card {}", srsCardId);
            UserLevelProgression prog = levelProgressionService.calculateProgression(user.getTotalXp());
            return new XpAwardResult(
                    0,
                    user.getTotalXp(),
                    prog.currentLevel(),
                    prog.nextLevelThresholdXp(),
                    prog.progressPercent(),
                    false
            );
        }
    }


    /**
     * Authoritatively awards bonus XP when an achievement milestone is unlocked.
     */
    @Transactional
    public XpAwardResult awardAchievementXp(User user, Achievement achievement) {
        if (user == null || achievement == null) {
            return createZeroResult(0L);
        }

        String sourceId = achievement.getCode();

        Optional<XpTransaction> existingTx = xpTransactionRepository.findByUserIdAndSourceTypeAndSourceId(
                user.getId(), XpSourceType.ACHIEVEMENT, sourceId
        );
        if (existingTx.isPresent()) {
            UserLevelProgression prog = levelProgressionService.calculateProgression(user.getTotalXp());
            return new XpAwardResult(
                    existingTx.get().getAmount(),
                    user.getTotalXp(),
                    prog.currentLevel(),
                    prog.nextLevelThresholdXp(),
                    prog.progressPercent(),
                    false
            );
        }

        int amount = ACHIEVEMENT_DEFAULT_XP;

        try {
            XpTransaction tx = new XpTransaction(
                    user,
                    XpSourceType.ACHIEVEMENT,
                    sourceId,
                    amount,
                    "Achievement: " + achievement.getName()
            );
            xpTransactionRepository.saveAndFlush(tx);

            user.setTotalXp(user.getTotalXp() + amount);
            userRepository.save(user);

            UserLevelProgression prog = levelProgressionService.calculateProgression(user.getTotalXp());
            log.info("Awarded {} XP to user {} for achievement {}", amount, user.getUsername(), achievement.getCode());
            return new XpAwardResult(
                    amount,
                    user.getTotalXp(),
                    prog.currentLevel(),
                    prog.nextLevelThresholdXp(),
                    prog.progressPercent(),
                    true
            );
        } catch (DataIntegrityViolationException ex) {
            log.warn("Duplicate achievement XP award caught by unique constraint for {}", achievement.getCode());
            UserLevelProgression prog = levelProgressionService.calculateProgression(user.getTotalXp());
            return new XpAwardResult(
                    ACHIEVEMENT_DEFAULT_XP,
                    user.getTotalXp(),
                    prog.currentLevel(),
                    prog.nextLevelThresholdXp(),
                    prog.progressPercent(),
                    false
            );
        }
    }

    /**
     * Retrieves current level progression for a given user.
     */
    @Transactional(readOnly = true)
    public UserLevelProgression getUserProgression(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        long xp = user != null ? user.getTotalXp() : 0L;
        return levelProgressionService.calculateProgression(xp);
    }

    private int calculatePracticeXpAmount(PracticeSession session) {
        int xp = BASE_PRACTICE_XP;

        String diff = session.getDifficultySnapshot() != null ? session.getDifficultySnapshot().toUpperCase() : "";
        if (diff.contains("ADVANCED")) {
            xp += BONUS_ADVANCED_XP;
        } else if (diff.contains("INTERMEDIATE")) {
            xp += BONUS_INTERMEDIATE_XP;
        }

        BigDecimal acc = session.getAccuracyPercent();
        if (acc != null) {
            if (acc.compareTo(new BigDecimal("100.00")) >= 0) {
                xp += BONUS_ACCURACY_100_XP;
            } else if (acc.compareTo(new BigDecimal("98.00")) >= 0) {
                xp += BONUS_ACCURACY_98_XP;
            }
        }

        return xp;
    }

    private XpAwardResult createZeroResult(long currentXp) {
        UserLevelProgression prog = levelProgressionService.calculateProgression(currentXp);
        return new XpAwardResult(0, currentXp, prog.currentLevel(), prog.nextLevelThresholdXp(), prog.progressPercent(), false);
    }
}
