package com.devtype.leaderboard;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RankedSeasonRepository extends JpaRepository<RankedSeason, Long> {

    Optional<RankedSeason> findByStatus(String status);

    Optional<RankedSeason> findBySeasonNumber(Integer seasonNumber);

    Optional<RankedSeason> findTopByOrderBySeasonNumberDesc();

    List<RankedSeason> findByOrderBySeasonNumberDesc();

    @Modifying
    @Query("DELETE FROM RankedSeason s WHERE s.seasonNumber < :thresholdSeasonNumber")
    void deleteOldSeasonsPriorTo(@Param("thresholdSeasonNumber") Integer thresholdSeasonNumber);
}
