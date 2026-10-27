package com.devtype.srs.controller;

import com.devtype.auth.security.SecurityUtils;
import com.devtype.common.dto.ApiResponse;
import com.devtype.srs.dto.SrsCardResponse;
import com.devtype.srs.dto.SubmitSrsReviewRequest;
import com.devtype.srs.service.SrsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/srs")
public class SrsController {

    private final SrsService srsService;

    public SrsController(SrsService srsService) {
        this.srsService = srsService;
    }

    @GetMapping("/due")
    public ResponseEntity<ApiResponse<List<SrsCardResponse>>> getDueCards() {
        Long userId = SecurityUtils.getRequiredCurrentUserId();
        List<SrsCardResponse> due = srsService.getDueCards(userId);
        return ResponseEntity.ok(ApiResponse.success(due));
    }

    @GetMapping("/due/{userId}")
    public ResponseEntity<List<SrsCardResponse>> getDueCardsByUserId(@PathVariable Long userId) {
        List<SrsCardResponse> due = srsService.getDueCards(userId);
        return ResponseEntity.ok(due);
    }

    @GetMapping("/deck")
    public ResponseEntity<ApiResponse<List<SrsCardResponse>>> getDeck() {
        Long userId = SecurityUtils.getRequiredCurrentUserId();
        List<SrsCardResponse> deck = srsService.getDeck(userId);
        return ResponseEntity.ok(ApiResponse.success(deck));
    }

    @GetMapping("/deck/{userId}")
    public ResponseEntity<List<SrsCardResponse>> getDeckByUserId(@PathVariable Long userId) {
        List<SrsCardResponse> deck = srsService.getDeck(userId);
        return ResponseEntity.ok(deck);
    }

    @PostMapping("/review")
    public ResponseEntity<ApiResponse<SrsCardResponse>> submitReview(
            @Valid @RequestBody SubmitSrsReviewRequest request) {
        Long userId = SecurityUtils.getRequiredCurrentUserId();
        SrsCardResponse response = srsService.submitReview(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
