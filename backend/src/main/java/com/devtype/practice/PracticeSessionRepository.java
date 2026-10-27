package com.devtype.practice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PracticeSessionRepository extends JpaRepository<PracticeSession, Long>, JpaSpecificationExecutor<PracticeSession> {

    Page<PracticeSession> findByUserIdOrderByStartedAtDesc(Long userId, Pageable pageable);

    List<PracticeSession> findByUserIdAndStatusOrderByStartedAtDesc(Long userId, PracticeSessionStatus status);

    List<PracticeSession> findByUserIdAndStatusOrderByStartedAtDesc(Long userId, PracticeSessionStatus status, Pageable pageable);

    List<PracticeSession> findByUserIdAndStartedAtBetween(Long userId, Instant start, Instant end);

    List<PracticeSession> findByUserId(Long userId);

    long countByUserIdAndStatus(Long userId, PracticeSessionStatus status);

    long countByStatus(PracticeSessionStatus status);

    @Query("SELECT COALESCE(SUM(s.durationMs), 0) FROM PracticeSession s WHERE s.status = :status")
    long getTotalPracticeDurationMsByStatus(@Param("status") PracticeSessionStatus status);

    Optional<PracticeSession> findByIdAndUserId(Long id, Long userId);

    @Query("""
        SELECT
            COUNT(s.id) as totalSessions,
            COALESCE(AVG(s.netWpm), 0) as avgNetWpm,
            COALESCE(MAX(s.netWpm), 0) as bestNetWpm,
            COALESCE(AVG(s.accuracyPercent), 0) as avgAccuracy,
            COALESCE(MAX(s.accuracyPercent), 0) as bestAccuracy,
            COALESCE(SUM(s.durationMs), 0) as totalDurationMs,
            COALESCE(SUM(s.totalCharacters), 0) as totalCharacters
        FROM PracticeSession s
        WHERE s.user.id = :userId AND s.status = :status
    """)
    SessionPerformanceSummary getPerformanceSummary(@Param("userId") Long userId, @Param("status") PracticeSessionStatus status);

    @Query("SELECT COUNT(DISTINCT s.languageSnapshot) FROM PracticeSession s WHERE s.user.id = :userId AND s.status = :status")
    long countDistinctLanguagesByUserIdAndStatus(@Param("userId") Long userId, @Param("status") PracticeSessionStatus status);

    @Query("""
        SELECT
            s.user.id as userId,
            COUNT(s.id) as sessions,
            COALESCE(MAX(s.netWpm), 0) as bestNetWpm,
            COALESCE(AVG(s.accuracyPercent), 0) as avgAccuracy,
            COALESCE(SUM(s.totalCharacters), 0) as totalCharacters
        FROM PracticeSession s
        WHERE s.status = :status AND s.startedAt >= :since
        GROUP BY s.user.id
    """)
    List<UserPerformanceRow> getLeaderboardStatsSince(@Param("status") PracticeSessionStatus status, @Param("since") Instant since);

    @Query("""
        SELECT
            s.user.id as userId,
            COUNT(s.id) as sessions,
            COALESCE(MAX(s.netWpm), 0) as bestNetWpm,
            COALESCE(AVG(s.accuracyPercent), 0) as avgAccuracy,
            COALESCE(SUM(s.totalCharacters), 0) as totalCharacters
        FROM PracticeSession s
        WHERE s.status = :status
        GROUP BY s.user.id
    """)
    List<UserPerformanceRow> getAllTimeLeaderboardStats(@Param("status") PracticeSessionStatus status);

    interface UserPerformanceRow {
        Long getUserId();
        Long getSessions();
        BigDecimal getBestNetWpm();
        Double getAvgAccuracy();
        Long getTotalCharacters();
    }

    interface SessionPerformanceSummary {
        Long getTotalSessions();
        Double getAvgNetWpm();
        BigDecimal getBestNetWpm();
        Double getAvgAccuracy();
        BigDecimal getBestAccuracy();
        Long getTotalDurationMs();
        Long getTotalCharacters();
    }
}

