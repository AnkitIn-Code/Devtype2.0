package com.devtype.snippet.controller;

import com.devtype.auth.security.SecurityUtils;
import com.devtype.common.dto.ApiResponse;
import com.devtype.snippet.dto.CreateSnippetRequest;
import com.devtype.snippet.dto.SnippetDetailResponse;
import com.devtype.snippet.dto.SnippetSummaryResponse;
import com.devtype.snippet.service.SnippetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/snippets")
public class SnippetController {

    private final SnippetService snippetService;

    public SnippetController(SnippetService snippetService) {
        this.snippetService = snippetService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SnippetSummaryResponse>>> listSnippets(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String difficulty) {
        List<SnippetSummaryResponse> list = snippetService.filterSnippets(category, language, difficulty);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{identifier}")
    public ResponseEntity<ApiResponse<SnippetDetailResponse>> getSnippet(@PathVariable String identifier) {
        SnippetDetailResponse response = snippetService.getByIdOrSlug(identifier);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SnippetDetailResponse>> createSnippet(
            @Valid @RequestBody CreateSnippetRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        SnippetDetailResponse created = snippetService.createSnippet(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SnippetDetailResponse>> updateSnippet(
            @PathVariable Long id,
            @Valid @RequestBody CreateSnippetRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        SnippetDetailResponse updated = snippetService.updateSnippet(id, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<SnippetSummaryResponse>>> getUserSnippets(@PathVariable Long userId) {
        List<SnippetSummaryResponse> list = snippetService.getUserSnippets(userId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<SnippetSummaryResponse>>> getMySnippets() {
        Long currentUserId = SecurityUtils.getRequiredCurrentUserId();
        List<SnippetSummaryResponse> list = snippetService.getUserSnippets(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSnippet(@PathVariable Long id) {
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        snippetService.deleteSnippet(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
