package com.devtype.leaderboard;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSeasonRatingRepository extends JpaRepository<UserSeasonRating, Long> {

    @Query("SELECT r FROM UserSeasonRating r JOIN FETCH r.user u WHERE r.season.id = :seasonId AND u.status = com.devtype.user.UserStatus.ACTIVE ORDER BY r.rating DESC, r.peakRating DESC, r.wins DESC, u.id ASC")
    List<UserSeasonRating> findLeaderboardBySeasonId(@Param("seasonId") Long seasonId);

    Optional<UserSeasonRating> findByUserIdAndSeasonId(Long userId, Long seasonId);

    @Query("SELECT COUNT(r) FROM UserSeasonRating r JOIN r.user u WHERE r.season.id = :seasonId AND u.status = com.devtype.user.UserStatus.ACTIVE")
    long countActiveCompetitorsBySeasonId(@Param("seasonId") Long seasonId);

    @Query("SELECT COUNT(r) FROM UserSeasonRating r WHERE r.season.id = :seasonId AND r.rating > :rating")
    long countPlayersAheadOf(@Param("seasonId") Long seasonId, @Param("rating") Integer rating);

    List<UserSeasonRating> findBySeasonId(Long seasonId);
}
