package com.devtype.leaderboard;

import com.devtype.common.entity.AuditableEntity;
import com.devtype.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Persisted ranked competitive season.
 * Enforces retaining at most the active current season and the previous season.
 */
@Entity
@Table(name = "ranked_seasons")
public class RankedSeason extends AuditableEntity {

    @Column(name = "season_number", nullable = false, unique = true)
    private Integer seasonNumber;

    @Column(name = "season_name", nullable = false, length = 100)
    private String seasonName;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE"; // 'ACTIVE', 'ENDED'

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "champion_user_id")
    private User championUser;

    @Column(name = "champion_name", length = 100)
    private String championName;

    @Column(name = "champion_username", length = 50)
    private String championUsername;

    @Column(name = "champion_rating")
    private Integer championRating;

    public RankedSeason() {
        super();
    }

    public RankedSeason(Integer seasonNumber, String seasonName, Instant startsAt, Instant endsAt) {
        this.seasonNumber = seasonNumber;
        this.seasonName = seasonName;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.status = "ACTIVE";
    }

    public Integer getSeasonNumber() {
        return seasonNumber;
    }

    public void setSeasonNumber(Integer seasonNumber) {
        this.seasonNumber = seasonNumber;
    }

    public String getSeasonName() {
        return seasonName;
    }

    public void setSeasonName(String seasonName) {
        this.seasonName = seasonName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public void setStartsAt(Instant startsAt) {
        this.startsAt = startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public void setEndsAt(Instant endsAt) {
        this.endsAt = endsAt;
    }

    public User getChampionUser() {
        return championUser;
    }

    public void setChampionUser(User championUser) {
        this.championUser = championUser;
    }

    public String getChampionName() {
        return championName;
    }

    public void setChampionName(String championName) {
        this.championName = championName;
    }

    public String getChampionUsername() {
        return championUsername;
    }

    public void setChampionUsername(String championUsername) {
        this.championUsername = championUsername;
    }

    public Integer getChampionRating() {
        return championRating;
    }

    public void setChampionRating(Integer championRating) {
        this.championRating = championRating;
    }
}
