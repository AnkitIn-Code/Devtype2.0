package com.devtype.xp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface XpTransactionRepository extends JpaRepository<XpTransaction, Long> {

    boolean existsByUserIdAndSourceTypeAndSourceId(Long userId, XpSourceType sourceType, String sourceId);

    Optional<XpTransaction> findByUserIdAndSourceTypeAndSourceId(Long userId, XpSourceType sourceType, String sourceId);

    List<XpTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT tx.user.id as userId, COALESCE(SUM(tx.amount), 0) as totalXp FROM XpTransaction tx WHERE tx.createdAt >= :since GROUP BY tx.user.id")
    List<UserXpRow> getXpTotalsSince(@org.springframework.data.repository.query.Param("since") java.time.Instant since);

    interface UserXpRow {
        Long getUserId();
        Long getTotalXp();
    }
}
