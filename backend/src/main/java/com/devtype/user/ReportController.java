package com.devtype.user;

import com.devtype.admin.dto.AdminReportResponse;
import com.devtype.admin.dto.CreateReportRequest;
import com.devtype.admin.service.AdminService;
import com.devtype.auth.security.SecurityUtils;
import com.devtype.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Controller allowing authenticated users to submit platform moderation reports,
 * file support desk tickets, view their ticket histories, and log automated anti-cheat incidents.
 */
@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    public ReportController(AdminService adminService, UserRepository userRepository) {
        this.adminService = adminService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitReport(
            @Valid @RequestBody CreateReportRequest request) {

        Long currentUserId = SecurityUtils.getRequiredCurrentUserId();
        UserReport report = adminService.createReport(currentUserId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(
                        Map.of(
                                "reportId", report.getId(),
                                "status", report.getStatus().name(),
                                "category", report.getCategory()
                        ),
                        "Report submitted successfully. Our moderation team will review it."
                )
        );
    }

    @PostMapping("/ticket")
    public ResponseEntity<ApiResponse<AdminReportResponse>> submitSupportTicket(
            @Valid @RequestBody CreateReportRequest request) {

        Long currentUserId = SecurityUtils.getRequiredCurrentUserId();
        UserReport report = adminService.createReport(currentUserId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(
                        AdminReportResponse.from(report),
                        "Support ticket submitted successfully. DevType support team will review your query."
                )
        );
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<ApiResponse<List<AdminReportResponse>>> getMyTickets() {
        Long currentUserId = SecurityUtils.getRequiredCurrentUserId();
        List<AdminReportResponse> tickets = adminService.getUserTickets(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(tickets, "Support tickets retrieved successfully"));
    }

    @PostMapping("/anti-cheat")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reportAntiCheatViolation(
            @RequestBody Map<String, Object> payload) {

        Long currentUserId = SecurityUtils.getRequiredCurrentUserId();
        User currentUser = userRepository.findById(currentUserId).orElse(null);
        if (currentUser != null && currentUser.getRole() == UserRole.ADMIN) {
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("flagged", false, "status", "EXEMPT", "message", "Platform administrators are exempt from anti-cheat flags"),
                    "Administrator accounts are exempt from automated cheat detection."
            ));
        }

        String violationType = String.valueOf(payload.getOrDefault("violationType", "UNAUTHORIZED_INPUT"));
        String contextMode = String.valueOf(payload.getOrDefault("mode", "PRACTICE"));
        String details = String.valueOf(payload.getOrDefault("details", "Suspicious automated keystroke/paste telemetry"));
        String title = "Automated Anti-Cheat Violation: " + violationType + " in " + contextMode;

        String description = String.format(
                "Anti-Cheat Telemetry Alert:\n- Violation Type: %s\n- Match Mode: %s\n- Details: %s\n- User ID: %d",
                violationType, contextMode, details, currentUserId
        );

        CreateReportRequest reportRequest = new CreateReportRequest(
                currentUserId, // reported user is the offending user
                title,
                "AUTOMATED_CHEAT_DETECTION",
                "CRITICAL",
                true, // isSystemFlagged
                description
        );

        UserReport report = adminService.createReport(currentUserId, reportRequest);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(
                        Map.of(
                                "reportId", report.getId(),
                                "flagged", true,
                                "category", "AUTOMATED_CHEAT_DETECTION"
                        ),
                        "Security violation logged."
                )
        );
    }
}
