package com.devtype.practice.service;

import com.devtype.common.dto.PageResponse;
import com.devtype.common.exception.ApiException;
import com.devtype.dashboard.service.DailyPracticeActivityService;
import com.devtype.practice.PracticeSession;
import com.devtype.practice.PracticeSessionRepository;
import com.devtype.practice.PracticeSessionStatus;
import com.devtype.practice.dto.CompletePracticeSessionRequest;
import com.devtype.practice.dto.PracticeSessionResponse;
import com.devtype.practice.dto.StartPracticeSessionRequest;
import com.devtype.template.PracticeTemplate;
import com.devtype.template.PracticeTemplateRepository;
import com.devtype.user.User;
import com.devtype.user.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import com.devtype.srs.service.SrsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Service managing the practice session lifecycle: initialization, client telemetry calculation,
 * session completion, abandonment, and user-specific historical session queries.
 */
@Service
public class PracticeSessionService {

    private static final Logger log = LoggerFactory.getLogger(PracticeSessionService.class);

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "startedAt", "completedAt", "durationMs", "grossWpm", "netWpm",
            "accuracyPercent", "totalCharacters", "createdAt", "id"
    );

    private final PracticeSessionRepository practiceSessionRepository;
    private final PracticeTemplateRepository practiceTemplateRepository;
    private final UserRepository userRepository;
    private final TypingMetricsCalculatorService typingMetricsCalculatorService;
    private final DailyPracticeActivityService dailyPracticeActivityService;
    private final com.devtype.xp.service.XpService xpService;
    private final com.devtype.achievement.service.AchievementService achievementService;
    private final SrsService srsService;

    public PracticeSessionService(
            PracticeSessionRepository practiceSessionRepository,
            PracticeTemplateRepository practiceTemplateRepository,
            UserRepository userRepository,
            TypingMetricsCalculatorService typingMetricsCalculatorService,
            DailyPracticeActivityService dailyPracticeActivityService,
            com.devtype.xp.service.XpService xpService,
            com.devtype.achievement.service.AchievementService achievementService,
            SrsService srsService
    ) {
        this.practiceSessionRepository = practiceSessionRepository;
        this.practiceTemplateRepository = practiceTemplateRepository;
        this.userRepository = userRepository;
        this.typingMetricsCalculatorService = typingMetricsCalculatorService;
        this.dailyPracticeActivityService = dailyPracticeActivityService;
        this.xpService = xpService;
        this.achievementService = achievementService;
        this.srsService = srsService;
    }

    /**
     * Starts a new practice session for the authenticated user and a specified published template.
     */
    @Transactional
    public PracticeSessionResponse startSession(Long userId, StartPracticeSessionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        PracticeTemplate template = null;
        PracticeSession session;

        // 1. Attempt template lookup by ID first, then by slug
        if (request.getTemplateId() != null) {
            template = practiceTemplateRepository.findByIdAndPublishedTrue(request.getTemplateId()).orElse(null);
        }
        if (template == null && request.getTemplateSlug() != null && !request.getTemplateSlug().isBlank()) {
            template = practiceTemplateRepository.findBySlugAndPublishedTrue(request.getTemplateSlug().trim()).orElse(null);
        }

        // 2. Initialize session from matched template, custom content, or robust fallback
        if (template != null) {
            session = new PracticeSession(
                    user,
                    template,
                    template.getTitle(),
                    template.getLanguage(),
                    template.getDifficulty().name(),
                    Instant.now()
            );
            session.setSourceContentSnapshot(template.getContent());
        } else if (request.getCustomContent() != null && !request.getCustomContent().isBlank()) {
            String title = (request.getCustomTitle() != null && !request.getCustomTitle().isBlank())
                    ? request.getCustomTitle().trim()
                    : (request.getTemplateSlug() != null ? request.getTemplateSlug().trim() : "Practice Sprint");
            String lang = (request.getCustomLanguage() != null && !request.getCustomLanguage().isBlank())
                    ? request.getCustomLanguage().trim() : "Code";
            String diff = (request.getCustomDifficulty() != null && !request.getCustomDifficulty().isBlank())
                    ? request.getCustomDifficulty().trim().toUpperCase() : "INTERMEDIATE";
            session = new PracticeSession(user, null, title, lang, diff, Instant.now());
            session.setSourceContentSnapshot(request.getCustomContent());
        } else {
            // Graceful fallback to first published template rather than failing
            template = practiceTemplateRepository.findAll(PageRequest.of(0, 1)).getContent().stream().findFirst().orElse(null);
            if (template != null) {
                session = new PracticeSession(
                        user,
                        template,
                        template.getTitle(),
                        template.getLanguage(),
                        template.getDifficulty().name(),
                        Instant.now()
                );
                session.setSourceContentSnapshot(template.getContent());
            } else {
                throw new ApiException("No practice template available to initialize session", HttpStatus.NOT_FOUND);
            }
        }

        session.setStatus(PracticeSessionStatus.IN_PROGRESS);
        PracticeSession saved = practiceSessionRepository.save(session);
        return PracticeSessionResponse.fromEntity(saved);
    }

    /**
     * Completes an in-progress practice session, calculating server-verified metrics
     * and transactionally updating the user's daily practice activity.
     */
    @Transactional
    public PracticeSessionResponse completeSession(Long userId, Long sessionId, CompletePracticeSessionRequest request) {
        PracticeSession session = practiceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException("Practice session not found", HttpStatus.NOT_FOUND));

        if (!session.getUser().getId().equals(userId)) {
            throw new ApiException("You are not authorized to modify this practice session", HttpStatus.FORBIDDEN);
        }

        // Idempotent completion check
        if (session.getStatus() == PracticeSessionStatus.COMPLETED) {
            return PracticeSessionResponse.fromEntity(session);
        }

        if (session.getStatus() == PracticeSessionStatus.ABANDONED) {
            throw new ApiException("Cannot complete an abandoned practice session", HttpStatus.CONFLICT);
        }

        Instant completedAt = Instant.now();

        // Calculate verified typing telemetry
        TypingMetricsCalculatorService.CalculatedMetrics metrics = typingMetricsCalculatorService.calculateMetrics(
                session.getStartedAt(),
                completedAt,
                request,
                session.getSourceContentSnapshot()
        );

        session.setCompletedAt(completedAt);
        session.setDurationMs(metrics.durationMs());
        session.setGrossWpm(metrics.grossWpm());
        session.setNetWpm(metrics.netWpm());
        session.setAccuracyPercent(metrics.accuracyPercent());
        session.setCorrectCharacters(metrics.correctCharacters());
        session.setIncorrectCharacters(metrics.incorrectCharacters());
        session.setTotalCharacters(metrics.totalCharacters());
        session.setErrorCount(metrics.errorCount());
        session.setStatus(PracticeSessionStatus.COMPLETED);

        PracticeSession saved = practiceSessionRepository.saveAndFlush(session);

        // Transactionally update daily activity
        dailyPracticeActivityService.recordCompletedSession(
                saved.getUser(),
                saved.getCompletedAt(),
                saved.getDurationMs(),
                saved.getTotalCharacters()
        );

        // Award XP idempotently
        com.devtype.xp.dto.XpAwardResult xpResult = xpService.awardPracticeSessionXp(saved);

        // Evaluate achievements
        List<com.devtype.achievement.dto.AchievementResponse> newlyUnlocked = achievementService.evaluatePracticeAchievements(saved);

        // SRS Spaced Repetition Matrix Evaluation (Only for platform templates, never Custom Studio)
        if (session.getTemplate() != null) {
            try {
                srsService.recordTemplateSession(
                        saved.getUser(),
                        session.getTemplate(),
                        metrics.netWpm().intValue(),
                        metrics.accuracyPercent().doubleValue(),
                        metrics.errorCount()
                );
            } catch (Exception srsEx) {
                log.warn("Could not evaluate SRS benchmark for template {}: {}", session.getTemplate().getId(), srsEx.getMessage());
            }
        }

        PracticeSessionResponse response = PracticeSessionResponse.fromEntity(saved);
        if (xpResult != null) {
            response.setXpEarned(xpResult.xpEarned());
            response.setTotalXp(xpResult.totalXp());
            response.setCurrentLevel(xpResult.currentLevel());
            response.setNextLevelXp(xpResult.nextLevelThresholdXp());
            response.setLevelProgressPercent(xpResult.levelProgressPercent());
        }
        response.setNewlyUnlockedAchievements(newlyUnlocked);

        return response;
    }

    /**
     * Abandons an in-progress practice session without recording completed practice metrics.
     */
    @Transactional
    public PracticeSessionResponse abandonSession(Long userId, Long sessionId) {
        PracticeSession session = practiceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException("Practice session not found", HttpStatus.NOT_FOUND));

        if (!session.getUser().getId().equals(userId)) {
            throw new ApiException("You are not authorized to modify this practice session", HttpStatus.FORBIDDEN);
        }

        if (session.getStatus() == PracticeSessionStatus.COMPLETED) {
            throw new ApiException("Cannot abandon an already completed practice session", HttpStatus.CONFLICT);
        }

        // Idempotent abandon check
        if (session.getStatus() == PracticeSessionStatus.ABANDONED) {
            return PracticeSessionResponse.fromEntity(session);
        }

        Instant now = Instant.now();
        session.setStatus(PracticeSessionStatus.ABANDONED);
        session.setCompletedAt(now);
        session.setDurationMs(Math.max(0L, Duration.between(session.getStartedAt(), now).toMillis()));

        PracticeSession saved = practiceSessionRepository.save(session);
        return PracticeSessionResponse.fromEntity(saved);
    }

    /**
     * Retrieves a single practice session owned by the authenticated user.
     */
    @Transactional(readOnly = true)
    public PracticeSessionResponse getSession(Long userId, Long sessionId) {
        PracticeSession session = practiceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException("Practice session not found", HttpStatus.NOT_FOUND));

        if (!session.getUser().getId().equals(userId)) {
            throw new ApiException("You are not authorized to view this practice session", HttpStatus.FORBIDDEN);
        }

        return PracticeSessionResponse.fromEntity(session);
    }

    /**
     * Lists the authenticated user's practice sessions with optional status, language, difficulty,
     * and date filtering, strictly enforcing database-level pagination.
     */
    @Transactional(readOnly = true)
    public PageResponse<PracticeSessionResponse> listUserSessions(
            Long userId,
            PracticeSessionStatus status,
            String language,
            String difficulty,
            Instant startDate,
            Instant endDate,
            Integer page,
            Integer size,
            String sort
    ) {
        int pageIndex = page != null ? page : 0;
        int pageSize = size != null ? size : 10;

        if (pageIndex < 0) {
            throw new IllegalArgumentException("Page index must not be less than zero (provided: " + pageIndex + ")");
        }
        if (pageSize < 1 || pageSize > 100) {
            throw new IllegalArgumentException("Page size must be between 1 and 100 (provided: " + pageSize + ")");
        }

        Pageable pageable = PageRequest.of(pageIndex, pageSize, parseSort(sort));

        Specification<PracticeSession> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // User isolation guarantee: Never return another user's sessions
            predicates.add(cb.equal(root.get("user").get("id"), userId));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (language != null && !language.isBlank() && !"All".equalsIgnoreCase(language)) {
                predicates.add(cb.equal(cb.lower(root.get("languageSnapshot")), language.trim().toLowerCase()));
            }
            if (difficulty != null && !difficulty.isBlank() && !"All".equalsIgnoreCase(difficulty)) {
                predicates.add(cb.equal(cb.upper(root.get("difficultySnapshot")), difficulty.trim().toUpperCase()));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startedAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startedAt"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<PracticeSession> pageResult = practiceSessionRepository.findAll(spec, pageable);
        List<PracticeSessionResponse> items = pageResult.getContent().stream()
                .map(PracticeSessionResponse::fromEntity)
                .toList();

        return new PageResponse<>(
                items,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                pageResult.isFirst(),
                pageResult.isLast(),
                pageResult.hasNext(),
                pageResult.hasPrevious()
        );
    }

    private Sort parseSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "startedAt");
        }

        String[] parts = sortParam.split(",");
        String property = parts[0].trim();
        Sort.Direction direction = (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim()))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        if (!ALLOWED_SORT_FIELDS.contains(property)) {
            throw new IllegalArgumentException(
                    "Unsupported sort field: '" + property + "'. Allowed sort fields are: " + ALLOWED_SORT_FIELDS
            );
        }

        return Sort.by(direction, property);
    }
}
