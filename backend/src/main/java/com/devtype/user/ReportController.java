package com.devtype.user;

import com.devtype.admin.dto.CreateReportRequest;
import com.devtype.admin.service.AdminService;
import com.devtype.auth.security.SecurityUtils;
import com.devtype.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controller allowing authenticated users to submit platform moderation reports.
 */
@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final AdminService adminService;

    public ReportController(AdminService adminService) {
        this.adminService = adminService;
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
}
