package com.devtype.practice.controller;

import com.devtype.auth.security.SecurityUtils;
import com.devtype.common.dto.ApiResponse;
import com.devtype.common.dto.PageResponse;
import com.devtype.practice.PracticeSessionStatus;
import com.devtype.practice.dto.CompletePracticeSessionRequest;
import com.devtype.practice.dto.PracticeSessionResponse;
import com.devtype.practice.dto.StartPracticeSessionRequest;
import com.devtype.practice.service.PracticeSessionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/**
 * REST controller managing the authenticated practice session lifecycle and session history.
 */
@RestController
@RequestMapping("/api/v1/practice-sessions")
public class PracticeSessionController {

    private final PracticeSessionService practiceSessionService;

    public PracticeSessionController(PracticeSessionService practiceSessionService) {
        this.practiceSessionService = practiceSessionService;
    }

    /**
     * Initializes a new practice session for the authenticated user.
     *
     * Example: POST /api/v1/practice-sessions
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PracticeSessionResponse>> startSession(
            @RequestBody @Valid StartPracticeSessionRequest request
    ) {
        Long userId = SecurityUtils.getRequiredCurrentUserId();
        PracticeSessionResponse response = practiceSessionService.startSession(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Practice session initialized"));
    }

    /**
     * Completes an in-progress practice session, calculating final verified metrics.
     *
     * Example: POST /api/v1/practice-sessions/{id}/complete
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<PracticeSessionResponse>> completeSession(
            @PathVariable Long id,
            @RequestBody @Valid CompletePracticeSessionRequest request
    ) {
        Long userId = SecurityUtils.getRequiredCurrentUserId();
        PracticeSessionResponse response = practiceSessionService.completeSession(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Practice session completed successfully"));
    }

    /**
     * Abandons an in-progress practice session.
     *
     * Example: POST /api/v1/practice-sessions/{id}/abandon
     */
    @PostMapping("/{id}/abandon")
    public ResponseEntity<ApiResponse<PracticeSessionResponse>> abandonSession(
            @PathVariable Long id
    ) {
        Long userId = SecurityUtils.getRequiredCurrentUserId();
        PracticeSessionResponse response = practiceSessionService.abandonSession(userId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Practice session abandoned"));
    }

    /**
     * Retrieves details for a specific practice session owned by the authenticated user.
     *
     * Example: GET /api/v1/practice-sessions/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PracticeSessionResponse>> getSession(
            @PathVariable Long id
    ) {
        Long userId = SecurityUtils.getRequiredCurrentUserId();
        PracticeSessionResponse response = practiceSessionService.getSession(userId, id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Lists the authenticated user's practice session history with filtering and pagination.
     *
     * Example: GET /api/v1/practice-sessions/me?status=COMPLETED&language=Java&page=0&size=10
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PageResponse<PracticeSessionResponse>>> listMySessions(
            @RequestParam(required = false) PracticeSessionStatus status,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer size,
            @RequestParam(required = false, defaultValue = "startedAt,desc") String sort
    ) {
        Long userId = SecurityUtils.getRequiredCurrentUserId();
        PageResponse<PracticeSessionResponse> response = practiceSessionService.listUserSessions(
                userId, status, language, difficulty, startDate, endDate, page, size, sort
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
