package com.devtype.srs;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface SrsCardRepository extends JpaRepository<SrsCard, Long> {

    List<SrsCard> findByUserId(Long userId);

    List<SrsCard> findByUserIdOrderByDueDateAsc(Long userId);

    @Query("SELECT c FROM SrsCard c WHERE c.user.id = :userId AND c.isMastered = false AND (c.dueDate IS NULL OR c.dueDate <= :now) ORDER BY c.dueDate ASC")
    List<SrsCard> findDueCardsByUserId(@Param("userId") Long userId, @Param("now") Instant now);

    Optional<SrsCard> findByUserIdAndSnippetId(Long userId, String snippetId);

    @Query("SELECT COUNT(c) FROM SrsCard c WHERE c.user.id = :userId AND c.isMastered = false AND (c.dueDate IS NULL OR c.dueDate <= :now)")
    long countDueCardsByUserId(@Param("userId") Long userId, @Param("now") Instant now);

    long countByUserId(Long userId);
}
