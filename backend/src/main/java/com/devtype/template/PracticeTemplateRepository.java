package com.devtype.template;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PracticeTemplateRepository extends JpaRepository<PracticeTemplate, Long>, JpaSpecificationExecutor<PracticeTemplate> {

    Optional<PracticeTemplate> findBySlug(String slug);

    Optional<PracticeTemplate> findBySlugAndPublishedTrue(String slug);

    Optional<PracticeTemplate> findByIdAndPublishedTrue(Long id);

    List<PracticeTemplate> findByLanguageAndPublishedTrue(String language);

    List<PracticeTemplate> findByCategoryAndPublishedTrue(String category);

    boolean existsBySlug(String slug);

    @Query("SELECT DISTINCT t.language FROM PracticeTemplate t WHERE t.published = true ORDER BY t.language ASC")
    List<String> findDistinctLanguagesByPublishedTrue();

    @Query("SELECT DISTINCT t.category FROM PracticeTemplate t WHERE t.published = true ORDER BY t.category ASC")
    List<String> findDistinctCategoriesByPublishedTrue();

    List<PracticeTemplate> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
}
