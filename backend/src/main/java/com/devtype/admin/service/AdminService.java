package com.devtype.admin.service;

import com.devtype.achievement.UserAchievementRepository;
import com.devtype.admin.dto.AdminOverviewResponse;
import com.devtype.admin.dto.AdminReportResponse;
import com.devtype.admin.dto.AdminUserDetailResponse;
import com.devtype.admin.dto.AdminUserResponse;
import com.devtype.admin.dto.CreateReportRequest;
import com.devtype.admin.dto.ReviewReportRequest;
import com.devtype.admin.dto.UpdateUserRoleRequest;
import com.devtype.admin.dto.UpdateUserStatusRequest;
import com.devtype.srs.SrsCardRepository;
import com.devtype.common.exception.ApiException;
import com.devtype.practice.PracticeSessionRepository;
import com.devtype.practice.PracticeSessionStatus;
import com.devtype.user.AccountType;
import com.devtype.user.ReportStatus;
import com.devtype.user.User;
import com.devtype.user.UserReport;
import com.devtype.user.UserReportRepository;
import com.devtype.user.UserRepository;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PracticeSessionRepository practiceSessionRepository;
    private final SrsCardRepository srsCardRepository;
    private final UserReportRepository userReportRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final AdminAuditLogService auditLogService;

    public AdminService(
            UserRepository userRepository,
            PracticeSessionRepository practiceSessionRepository,
            SrsCardRepository srsCardRepository,
            UserReportRepository userReportRepository,
            UserAchievementRepository userAchievementRepository,
            AdminAuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.practiceSessionRepository = practiceSessionRepository;
        this.srsCardRepository = srsCardRepository;
        this.userReportRepository = userReportRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.auditLogService = auditLogService;
    }


    @Transactional(readOnly = true)
    public AdminOverviewResponse getOverview() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long suspendedUsers = userRepository.countByStatus(UserStatus.SUSPENDED);
        long deactivatedUsers = userRepository.countByStatus(UserStatus.DEACTIVATED);

        long standardUsers = userRepository.countByAccountType(AccountType.STANDARD);
        long demoUsers = userRepository.countByAccountType(AccountType.DEMO);

        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);

        long newUsersLast7Days = userRepository.countByCreatedAtAfter(sevenDaysAgo);
        long newUsersLast30Days = userRepository.countByCreatedAtAfter(thirtyDaysAgo);

        long totalSessions = practiceSessionRepository.countByStatus(PracticeSessionStatus.COMPLETED);
        long totalPracticeDurationMs = practiceSessionRepository.getTotalPracticeDurationMsByStatus(PracticeSessionStatus.COMPLETED);
        long totalPracticeDurationSeconds = totalPracticeDurationMs / 1000;
        long totalChallengeAttempts = srsCardRepository.count();

        Map<String, Long> reportsByStatus = new LinkedHashMap<>();
        for (ReportStatus status : ReportStatus.values()) {
            reportsByStatus.put(status.name(), userReportRepository.countByStatus(status));
        }

        long totalReports = userReportRepository.count();
        long openReports = reportsByStatus.getOrDefault(ReportStatus.OPEN.name(), 0L);
        long pendingReviewReports = reportsByStatus.getOrDefault(ReportStatus.UNDER_REVIEW.name(), 0L);

        return new AdminOverviewResponse(
                totalUsers,
                activeUsers,
                suspendedUsers,
                deactivatedUsers,
                standardUsers,
                demoUsers,
                newUsersLast7Days,
                newUsersLast30Days,
                totalSessions,
                totalPracticeDurationMs,
                totalPracticeDurationSeconds,
                totalChallengeAttempts,
                reportsByStatus,
                totalReports,
                openReports,
                pendingReviewReports
        );
    }

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> listUsers(
            String search,
            UserStatus status,
            UserRole role,
            AccountType accountType,
            Pageable pageable) {

        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                Predicate usernameMatch = cb.like(cb.lower(root.get("username")), term);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), term);
                Predicate displayNameMatch = cb.like(cb.lower(root.get("displayName")), term);
                predicates.add(cb.or(usernameMatch, emailMatch, displayNameMatch));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }
            if (accountType != null) {
                predicates.add(cb.equal(root.get("accountType"), accountType));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return userRepository.findAll(spec, pageable).map(AdminUserResponse::fromUser);
    }

    @Transactional(readOnly = true)
    public AdminUserDetailResponse getUserDetail(Long targetUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiException("User not found with ID: " + targetUserId, HttpStatus.NOT_FOUND));

        var perf = practiceSessionRepository.getPerformanceSummary(targetUserId, PracticeSessionStatus.COMPLETED);
        long completedSessions = perf != null && perf.getTotalSessions() != null ? perf.getTotalSessions() : 0L;
        long durationMs = perf != null && perf.getTotalDurationMs() != null ? perf.getTotalDurationMs() : 0L;

        long completedChallenges = srsCardRepository.countByUserId(targetUserId);
        long unlockedAchievements = userAchievementRepository.countByUserId(targetUserId);

        long reportsFiled = userReportRepository.countByReporterId(targetUserId);
        long reportsAgainst = userReportRepository.countByReportedUserId(targetUserId);

        return AdminUserDetailResponse.of(
                user,
                completedSessions,
                durationMs / 1000,
                perf != null ? perf.getAvgNetWpm() : 0.0,
                perf != null ? perf.getBestNetWpm() : null,
                perf != null ? perf.getAvgAccuracy() : 0.0,
                completedChallenges,
                unlockedAchievements,
                reportsFiled,
                reportsAgainst
        );
    }

    @Transactional
    public AdminUserResponse updateUserStatus(
            Long targetUserId,
            UpdateUserStatusRequest request,
            Long actingAdminId,
            HttpServletRequest servletRequest) {

        if (targetUserId.equals(actingAdminId)) {
            throw new ApiException("Administrators cannot modify their own account status", HttpStatus.BAD_REQUEST);
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiException("User not found with ID: " + targetUserId, HttpStatus.NOT_FOUND));

        UserStatus previousStatus = targetUser.getStatus();
        if (previousStatus == request.status()) {
            return AdminUserResponse.fromUser(targetUser);
        }

        // Prevent suspending or deactivating the last active administrator account
        if (targetUser.getRole() == UserRole.ADMIN && request.status() != UserStatus.ACTIVE) {
            long activeAdminCount = userRepository.countByRoleAndStatus(UserRole.ADMIN, UserStatus.ACTIVE);
            if (activeAdminCount <= 1) {
                throw new ApiException("Cannot suspend or deactivate the last active administrator account.", HttpStatus.BAD_REQUEST);
            }
        }

        targetUser.setStatus(request.status());
        User savedUser = userRepository.save(targetUser);

        // Append to immutable administrative audit log
        auditLogService.recordLog(
                actingAdminId,
                "USER_STATUS_CHANGE",
                "USER",
                targetUserId,
                previousStatus.name(),
                request.status().name(),
                request.reason(),
                servletRequest
        );

        return AdminUserResponse.fromUser(savedUser);
    }

    @Transactional
    public AdminUserResponse updateUserRole(
            Long targetUserId,
            UpdateUserRoleRequest request,
            Long actingAdminId,
            HttpServletRequest servletRequest) {

        if (targetUserId.equals(actingAdminId) && request.role() != UserRole.ADMIN) {
            throw new ApiException("Administrators cannot revoke their own administrator role.", HttpStatus.BAD_REQUEST);
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiException("User not found with ID: " + targetUserId, HttpStatus.NOT_FOUND));

        UserRole previousRole = targetUser.getRole();
        if (previousRole == request.role()) {
            return AdminUserResponse.fromUser(targetUser);
        }

        // Prevent demoting the last active administrator
        if (previousRole == UserRole.ADMIN && request.role() != UserRole.ADMIN) {
            long activeAdminCount = userRepository.countByRoleAndStatus(UserRole.ADMIN, UserStatus.ACTIVE);
            if (activeAdminCount <= 1) {
                throw new ApiException("Cannot demote the last active administrator account.", HttpStatus.BAD_REQUEST);
            }
        }

        targetUser.setRole(request.role());
        User savedUser = userRepository.save(targetUser);

        auditLogService.recordLog(
                actingAdminId,
                "USER_ROLE_CHANGE",
                "USER",
                targetUserId,
                previousRole.name(),
                request.role().name(),
                request.reason(),
                servletRequest
        );

        return AdminUserResponse.fromUser(savedUser);
    }

    @Transactional(readOnly = true)
    public Page<AdminReportResponse> listReports(ReportStatus status, String category, Pageable pageable) {
        Specification<UserReport> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("category")), category.trim().toUpperCase()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return userReportRepository.findAll(spec, pageable).map(AdminReportResponse::from);
    }

    @Transactional(readOnly = true)
    public AdminReportResponse getReportById(Long reportId) {
        UserReport report = userReportRepository.findById(reportId)
                .orElseThrow(() -> new ApiException("Abuse report not found with ID: " + reportId, HttpStatus.NOT_FOUND));
        return AdminReportResponse.from(report);
    }

    @Transactional
    public AdminReportResponse reviewReport(
            Long reportId,
            ReviewReportRequest request,
            Long actingAdminId,
            HttpServletRequest servletRequest) {

        UserReport report = userReportRepository.findById(reportId)
                .orElseThrow(() -> new ApiException("Abuse report not found with ID: " + reportId, HttpStatus.NOT_FOUND));

        User admin = userRepository.findById(actingAdminId)
                .orElseThrow(() -> new ApiException("Acting administrator not found", HttpStatus.UNAUTHORIZED));

        ReportStatus previousStatus = report.getStatus();
        report.setStatus(request.status());
        report.setReviewedByUser(admin);
        report.setReviewedAt(Instant.now());
        if (request.resolutionNote() != null) {
            report.setResolutionNote(request.resolutionNote().trim());
        }

        UserReport savedReport = userReportRepository.save(report);

        auditLogService.recordLog(
                actingAdminId,
                "REPORT_STATUS_CHANGE",
                "REPORT",
                reportId,
                previousStatus.name(),
                request.status().name(),
                request.resolutionNote(),
                servletRequest
        );

        return AdminReportResponse.from(savedReport);
    }

    @Transactional
    public UserReport createReport(Long reporterUserId, CreateReportRequest request) {
        User reporter = userRepository.findById(reporterUserId)
                .orElseThrow(() -> new ApiException("Reporter user not found", HttpStatus.UNAUTHORIZED));

        User reportedUser = null;
        if (request.reportedUserId() != null) {
            if (request.reportedUserId().equals(reporterUserId)) {
                throw new ApiException("Users cannot file reports against their own account.", HttpStatus.BAD_REQUEST);
            }
            reportedUser = userRepository.findById(request.reportedUserId())
                    .orElseThrow(() -> new ApiException("Reported user not found with ID: " + request.reportedUserId(), HttpStatus.BAD_REQUEST));
        }

        UserReport report = new UserReport(
                reporter,
                reportedUser,
                request.category().trim().toUpperCase(),
                request.description().trim()
        );
        report.setStatus(ReportStatus.OPEN);

        return userReportRepository.save(report);
    }
}
