package com.devtype.dashboard;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyPracticeActivityRepository extends JpaRepository<DailyPracticeActivity, Long> {

    Optional<DailyPracticeActivity> findByUserIdAndActivityDate(Long userId, LocalDate activityDate);

    List<DailyPracticeActivity> findByUserIdAndActivityDateBetweenOrderByActivityDateAsc(
            Long userId, LocalDate startDate, LocalDate endDate);

    List<DailyPracticeActivity> findByUserId(Long userId);

    List<DailyPracticeActivity> findByUserIdOrderByActivityDateDesc(Long userId);

    List<DailyPracticeActivity> findByUserIdOrderByActivityDateAsc(Long userId);
}
