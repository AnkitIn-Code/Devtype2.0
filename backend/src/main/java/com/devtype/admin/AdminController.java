package com.devtype.admin;

import com.devtype.admin.dto.AdminAuditLogResponse;
import com.devtype.admin.dto.AdminOverviewResponse;
import com.devtype.admin.dto.AdminReportResponse;
import com.devtype.admin.dto.AdminUserDetailResponse;
import com.devtype.admin.dto.AdminUserResponse;
import com.devtype.admin.dto.ReviewReportRequest;
import com.devtype.admin.dto.UpdateUserRoleRequest;
import com.devtype.admin.dto.UpdateUserStatusRequest;
import com.devtype.admin.service.AdminAuditLogService;
import com.devtype.admin.service.AdminService;
import com.devtype.auth.security.SecurityUtils;
import com.devtype.common.dto.ApiResponse;
import com.devtype.user.AccountType;
import com.devtype.user.ReportStatus;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST controller for administrative management, user governance, moderation, and audit logs.
 * Accessible exclusively to users possessing the ADMIN authority.
 */
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final AdminAuditLogService auditLogService;
    private final com.devtype.admin.service.AdminMonitoringService monitoringService;

    public AdminController(
            AdminService adminService,
            AdminAuditLogService auditLogService,
            com.devtype.admin.service.AdminMonitoringService monitoringService) {
        this.adminService = adminService;
        this.auditLogService = auditLogService;
        this.monitoringService = monitoringService;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminStatus() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "ACTIVE",
                "service", "devtype-admin-governance",
                "authorizedRole", "ADMIN"
        )));
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AdminOverviewResponse>> getOverview() {
        AdminOverviewResponse overview = adminService.getOverview();
        return ResponseEntity.ok(ApiResponse.success(overview, "Admin platform overview retrieved successfully"));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<AdminUserResponse>>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) AccountType accountType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<AdminUserResponse> users = adminService.listUsers(search, status, role, accountType, pageable);
        return ResponseEntity.ok(ApiResponse.success(users, "Users retrieved successfully"));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<AdminUserDetailResponse>> getUserDetail(@PathVariable Long id) {
        AdminUserDetailResponse userDetail = adminService.getUserDetail(id);
        return ResponseEntity.ok(ApiResponse.success(userDetail, "User details retrieved successfully"));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            HttpServletRequest servletRequest) {

        Long actingAdminId = SecurityUtils.getRequiredCurrentUserId();
        AdminUserResponse updatedUser = adminService.updateUserStatus(id, request, actingAdminId, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(updatedUser, "User status updated successfully"));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            HttpServletRequest servletRequest) {

        Long actingAdminId = SecurityUtils.getRequiredCurrentUserId();
        AdminUserResponse updatedUser = adminService.updateUserRole(id, request, actingAdminId, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(updatedUser, "User role updated successfully"));
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<Page<AdminReportResponse>>> listReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) String category,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<AdminReportResponse> reports = adminService.listReports(status, category, pageable);
        return ResponseEntity.ok(ApiResponse.success(reports, "Abuse reports retrieved successfully"));
    }

    @GetMapping("/reports/{id}")
    public ResponseEntity<ApiResponse<AdminReportResponse>> getReportById(@PathVariable Long id) {
        AdminReportResponse report = adminService.getReportById(id);
        return ResponseEntity.ok(ApiResponse.success(report, "Abuse report retrieved successfully"));
    }

    @PatchMapping("/reports/{id}")
    public ResponseEntity<ApiResponse<AdminReportResponse>> reviewReport(
            @PathVariable Long id,
            @Valid @RequestBody ReviewReportRequest request,
            HttpServletRequest servletRequest) {

        Long actingAdminId = SecurityUtils.getRequiredCurrentUserId();
        AdminReportResponse reviewedReport = adminService.reviewReport(id, request, actingAdminId, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(reviewedReport, "Abuse report reviewed successfully"));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AdminAuditLogResponse>>> getAuditLogs(
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Long adminUserId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<AdminAuditLogResponse> logs = auditLogService.getAuditLogs(actionType, targetType, adminUserId, pageable);
        return ResponseEntity.ok(ApiResponse.success(logs, "Administrative audit logs retrieved successfully"));
    }

    @GetMapping("/metrics/summary")
    public ResponseEntity<ApiResponse<com.devtype.admin.dto.AdminMetricsSummaryResponse>> getMetricsSummary() {
        var summary = monitoringService.getMetricsSummary();
        return ResponseEntity.ok(ApiResponse.success(summary, "Operational metrics summary retrieved successfully"));
    }

    @GetMapping("/metrics/timeseries")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMetricsTimeseries() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "SCRAPING_ACTIVE",
                "message", "Prometheus time-series metrics are available for scraping via /actuator/prometheus. Long-term persistent time-series graphing requires an external Prometheus/Grafana instance.",
                "prometheusEndpoint", "/actuator/prometheus",
                "supportedPercentiles", "p50, p95, p99",
                "metricNamespace", "http.server.requests"
        ), "Time-series monitoring configuration retrieved successfully"));
    }
}
