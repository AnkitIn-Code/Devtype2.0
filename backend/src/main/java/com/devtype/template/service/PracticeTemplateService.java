package com.devtype.template.service;

import com.devtype.common.dto.PageResponse;
import com.devtype.common.exception.BadRequestException;
import com.devtype.common.exception.ResourceNotFoundException;
import com.devtype.template.DifficultyLevel;
import com.devtype.template.PracticeTemplate;
import com.devtype.template.PracticeTemplateRepository;
import com.devtype.template.dto.PracticeTemplateDetailResponse;
import com.devtype.template.dto.PracticeTemplateSummaryResponse;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Service managing practice template browsing, detail retrieval, and filtering.
 */
@Service
@Transactional(readOnly = true)
public class PracticeTemplateService {

    private static final int DEFAULT_PAGE_SIZE = 12;
    private static final int MAX_PAGE_SIZE = 100;

    private static final Set<String> ALLOWED_SORT_PROPERTIES = Set.of(
            "id",
            "slug",
            "title",
            "language",
            "difficulty",
            "category",
            "estimatedDurationSeconds",
            "createdAt",
            "updatedAt"
    );

    private final PracticeTemplateRepository practiceTemplateRepository;

    public PracticeTemplateService(PracticeTemplateRepository practiceTemplateRepository) {
        this.practiceTemplateRepository = practiceTemplateRepository;
    }

    /**
     * Lists published templates with optional filtering, search, pagination, and sorting.
     */
    public PageResponse<PracticeTemplateSummaryResponse> listPublishedTemplates(
            String language,
            String difficulty,
            String category,
            String search,
            Integer page,
            Integer size,
            String sort
    ) {
        int pageNumber = (page != null) ? page : 0;
        int pageSize = (size != null) ? size : DEFAULT_PAGE_SIZE;

        if (pageNumber < 0) {
            throw new BadRequestException("Page index must not be less than zero (provided: " + pageNumber + ")");
        }
        if (pageSize < 1) {
            throw new BadRequestException("Page size must be at least 1 (provided: " + pageSize + ")");
        }
        if (pageSize > MAX_PAGE_SIZE) {
            throw new BadRequestException("Page size must not exceed " + MAX_PAGE_SIZE + " (provided: " + pageSize + ")");
        }

        Sort sortOrder = parseAndValidateSort(sort);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sortOrder);

        DifficultyLevel difficultyEnum = parseDifficulty(difficulty);

        Specification<PracticeTemplate> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always enforce published = true
            predicates.add(cb.isTrue(root.get("published")));

            // Language filter (case-insensitive)
            if (language != null && !language.isBlank() && !"All".equalsIgnoreCase(language.trim())) {
                predicates.add(cb.equal(cb.lower(root.get("language")), language.trim().toLowerCase()));
            }

            // Difficulty filter
            if (difficultyEnum != null) {
                predicates.add(cb.equal(root.get("difficulty"), difficultyEnum));
            }

            // Category filter (case-insensitive)
            if (category != null && !category.isBlank() && !"All".equalsIgnoreCase(category.trim())
                    && !"All Collections".equalsIgnoreCase(category.trim())) {
                predicates.add(cb.equal(cb.lower(root.get("category")), category.trim().toLowerCase()));
            }

            // Search query across title, description, slug, language, category
            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), searchPattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), searchPattern);
                Predicate slugMatch = cb.like(cb.lower(root.get("slug")), searchPattern);
                Predicate langMatch = cb.like(cb.lower(root.get("language")), searchPattern);
                Predicate catMatch = cb.like(cb.lower(root.get("category")), searchPattern);
                predicates.add(cb.or(titleMatch, descMatch, slugMatch, langMatch, catMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<PracticeTemplate> pageResult = practiceTemplateRepository.findAll(spec, pageable);
        Page<PracticeTemplateSummaryResponse> dtoPage = pageResult.map(PracticeTemplateSummaryResponse::from);

        return PageResponse.from(dtoPage);
    }

    /**
     * Retrieves published template details by ID or unique slug.
     */
    public PracticeTemplateDetailResponse getPublishedTemplateByIdOrSlug(String idOrSlug) {
        if (idOrSlug == null || idOrSlug.isBlank()) {
            throw new BadRequestException("Template identifier must not be blank");
        }

        String trimmed = idOrSlug.trim();

        // 1. If numeric, attempt ID lookup first
        if (trimmed.matches("^\\d+$")) {
            Long id = Long.parseLong(trimmed);
            var byId = practiceTemplateRepository.findByIdAndPublishedTrue(id);
            if (byId.isPresent()) {
                return PracticeTemplateDetailResponse.from(byId.get());
            }
        }

        // 2. Attempt slug lookup
        return practiceTemplateRepository.findBySlugAndPublishedTrue(trimmed)
                .map(PracticeTemplateDetailResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Practice template not found with identifier: '" + trimmed + "'"
                ));
    }

    /**
     * Retrieves published template details explicitly by slug.
     */
    public PracticeTemplateDetailResponse getPublishedTemplateBySlug(String slug) {
        if (slug == null || slug.isBlank()) {
            throw new BadRequestException("Template slug must not be blank");
        }
        return practiceTemplateRepository.findBySlugAndPublishedTrue(slug.trim())
                .map(PracticeTemplateDetailResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Practice template not found with slug: '" + slug.trim() + "'"
                ));
    }

    /**
     * Returns all distinct languages of published templates.
     */
    public List<String> getDistinctLanguages() {
        return practiceTemplateRepository.findDistinctLanguagesByPublishedTrue();
    }

    /**
     * Returns all distinct categories of published templates.
     */
    public List<String> getDistinctCategories() {
        return practiceTemplateRepository.findDistinctCategoriesByPublishedTrue();
    }

    /**
     * Parses and safely validates the sort expression against the allowed property whitelist.
     */
    private Sort parseAndValidateSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }

        String[] parts = sort.split(",");
        String property = parts[0].trim();

        if (!ALLOWED_SORT_PROPERTIES.contains(property)) {
            throw new BadRequestException(
                    "Unsupported sort field: '" + property + "'. Allowed sort fields are: " + ALLOWED_SORT_PROPERTIES
            );
        }

        Sort.Direction direction = Sort.Direction.ASC;
        if (parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())) {
            direction = Sort.Direction.DESC;
        }

        return Sort.by(direction, property);
    }

    /**
     * Safely parses difficulty strings case-insensitively into DifficultyLevel enum.
     */
    private DifficultyLevel parseDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank() || "All".equalsIgnoreCase(difficulty.trim())) {
            return null;
        }
        try {
            return DifficultyLevel.valueOf(difficulty.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "Invalid difficulty: '" + difficulty + "'. Allowed values: BEGINNER, INTERMEDIATE, ADVANCED"
            );
        }
    }
}
