package com.devtype.snippet;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SnippetRepository extends JpaRepository<Snippet, Long> {

    List<Snippet> findByCreatedByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Snippet> findBySlug(String slug);

    List<Snippet> findByIsCuratedTrue();

    @Query("""
        SELECT s FROM Snippet s
        WHERE (:category IS NULL OR LOWER(s.category) = LOWER(:category))
          AND (:language IS NULL OR LOWER(s.language) = LOWER(:language))
          AND (:difficulty IS NULL OR LOWER(s.difficulty) = LOWER(:difficulty))
        ORDER BY s.createdAt DESC
    """)
    List<Snippet> filterSnippets(
            @Param("category") String category,
            @Param("language") String language,
            @Param("difficulty") String difficulty
    );
}
