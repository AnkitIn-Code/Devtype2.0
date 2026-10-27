package com.devtype.ai.controller;

import com.devtype.ai.dto.AiQuotaResponse;
import com.devtype.ai.dto.GenerateTemplateRequest;
import com.devtype.ai.dto.GeneratedTemplateResponse;
import com.devtype.ai.dto.SaveGeneratedTemplateRequest;
import com.devtype.ai.service.AiTemplateGeneratorService;
import com.devtype.auth.security.SecurityUtils;
import com.devtype.common.dto.ApiResponse;
import com.devtype.template.dto.PracticeTemplateDetailResponse;
import com.devtype.template.dto.PracticeTemplateSummaryResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller providing AI code template generation and template saving capabilities.
 * All generation and save endpoints require authenticated platform access.
 */
@RestController
@RequestMapping("/api/v1/ai")
public class AiTemplateController {

    private final AiTemplateGeneratorService aiTemplateGeneratorService;

    public AiTemplateController(AiTemplateGeneratorService aiTemplateGeneratorService) {
        this.aiTemplateGeneratorService = aiTemplateGeneratorService;
    }

    /**
     * Generates a code typing template using Fireworks AI and DeepSeek V4 Pro.
     * Enforces per-user hourly quota and returns validated template data with duration estimates.
     *
     * Example: POST /api/v1/ai/templates/generate
     */
    @PostMapping("/templates/generate")
    public ResponseEntity<ApiResponse<GeneratedTemplateResponse>> generateTemplate(
            @Valid @RequestBody GenerateTemplateRequest request) {

        Long currentUserId = SecurityUtils.getRequiredCurrentUserId();
        GeneratedTemplateResponse response = aiTemplateGeneratorService.generateTemplate(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Code practice template generated successfully"));
    }

    /**
     * Persists an AI-generated template into the authenticated user's private template library.
     *
     * Example: POST /api/v1/ai/templates/save
     */
    @PostMapping("/templates/save")
    public ResponseEntity<ApiResponse<PracticeTemplateDetailResponse>> saveTemplate(
            @Valid @RequestBody SaveGeneratedTemplateRequest request) {

        Long currentUserId = SecurityUtils.getRequiredCurrentUserId();
        PracticeTemplateDetailResponse savedTemplate = aiTemplateGeneratorService.saveGeneratedTemplate(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(savedTemplate, "AI template saved to your personal library"));
    }

    /**
     * Retrieves all saved AI templates authored by the authenticated user.
     *
     * Example: GET /api/v1/ai/templates/saved
     */
    @GetMapping("/templates/saved")
    public ResponseEntity<ApiResponse<List<PracticeTemplateSummaryResponse>>> getMySavedTemplates() {
        Long currentUserId = SecurityUtils.getRequiredCurrentUserId();
        List<PracticeTemplateSummaryResponse> saved = aiTemplateGeneratorService.listUserSavedTemplates(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(saved, "User saved templates retrieved"));
    }

    /**
     * Returns the authenticated user's remaining hourly AI generation quota.
     *
     * Example: GET /api/v1/ai/quota
     */
    @GetMapping("/quota")
    public ResponseEntity<ApiResponse<AiQuotaResponse>> getQuota() {
        Long currentUserId = SecurityUtils.getRequiredCurrentUserId();
        AiQuotaResponse quota = aiTemplateGeneratorService.getUserQuota(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(quota, "AI generation quota status"));
    }
}
