package com.devtype.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserReportRepository extends JpaRepository<UserReport, Long>, JpaSpecificationExecutor<UserReport> {

    List<UserReport> findByReporterIdOrderByCreatedAtDesc(Long reporterUserId);

    Page<UserReport> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);

    List<UserReport> findByReportedUserIdOrderByCreatedAtDesc(Long reportedUserId);

    List<UserReport> findByReviewedByUserIdOrderByReviewedAtDesc(Long reviewedByUserId);

    long countByStatus(ReportStatus status);

    long countByReporterId(Long reporterUserId);

    long countByReportedUserId(Long reportedUserId);
}
