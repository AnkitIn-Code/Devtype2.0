package com.devtype.template.controller;

import com.devtype.common.dto.ApiResponse;
import com.devtype.common.dto.PageResponse;
import com.devtype.template.dto.PracticeTemplateDetailResponse;
import com.devtype.template.dto.PracticeTemplateSummaryResponse;
import com.devtype.template.service.PracticeTemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller exposing public, read-only practice template catalog endpoints.
 */
@RestController
@RequestMapping("/api/v1/templates")
public class PracticeTemplateController {

    private final PracticeTemplateService practiceTemplateService;

    public PracticeTemplateController(PracticeTemplateService practiceTemplateService) {
        this.practiceTemplateService = practiceTemplateService;
    }

    /**
     * Lists published practice templates with optional filtering, search, pagination, and sorting.
     *
     * Example: GET /api/v1/templates?language=java&difficulty=BEGINNER&page=0&size=12&sort=createdAt,desc
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PracticeTemplateSummaryResponse>>> listTemplates(
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "12") Integer size,
            @RequestParam(required = false, defaultValue = "createdAt,desc") String sort
    ) {
        PageResponse<PracticeTemplateSummaryResponse> pageResult = practiceTemplateService.listPublishedTemplates(
                language, difficulty, category, search, page, size, sort
        );
        return ResponseEntity.ok(ApiResponse.success(pageResult));
    }

    /**
     * Retrieves published template details by ID or unique slug.
     *
     * Example: GET /api/v1/templates/1 or GET /api/v1/templates/java-binary-search
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PracticeTemplateDetailResponse>> getTemplate(
            @PathVariable String id
    ) {
        PracticeTemplateDetailResponse template = practiceTemplateService.getPublishedTemplateByIdOrSlug(id);
        return ResponseEntity.ok(ApiResponse.success(template));
    }

    /**
     * Explicit slug-based detail lookup.
     *
     * Example: GET /api/v1/templates/slug/java-binary-search
     */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<PracticeTemplateDetailResponse>> getTemplateBySlug(
            @PathVariable String slug
    ) {
        PracticeTemplateDetailResponse template = practiceTemplateService.getPublishedTemplateBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(template));
    }

    /**
     * Returns list of all distinct programming languages available in published templates.
     *
     * Example: GET /api/v1/templates/languages
     */
    @GetMapping("/languages")
    public ResponseEntity<ApiResponse<List<String>>> getLanguages() {
        List<String> languages = practiceTemplateService.getDistinctLanguages();
        return ResponseEntity.ok(ApiResponse.success(languages));
    }

    /**
     * Returns list of all distinct categories available in published templates.
     *
     * Example: GET /api/v1/templates/categories
     */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        List<String> categories = practiceTemplateService.getDistinctCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }
}
