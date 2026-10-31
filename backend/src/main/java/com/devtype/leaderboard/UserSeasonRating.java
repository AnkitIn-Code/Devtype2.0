package com.devtype.leaderboard;

import com.devtype.common.entity.AuditableEntity;
import com.devtype.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Persisted user competitive rating and BGMI tier for a specific season.
 */
@Entity
@Table(name = "user_season_ratings")
public class UserSeasonRating extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "season_id", nullable = false)
    private RankedSeason season;

    @Column(name = "rating", nullable = false)
    private Integer rating = 1200;

    @Column(name = "peak_rating", nullable = false)
    private Integer peakRating = 1200;

    @Column(name = "tier", nullable = false, length = 50)
    private String tier = "Bronze III";

    @Column(name = "previous_season_tier", length = 50)
    private String previousSeasonTier;

    @Column(name = "wins", nullable = false)
    private Integer wins = 0;

    @Column(name = "losses", nullable = false)
    private Integer losses = 0;

    @Column(name = "matches_played", nullable = false)
    private Integer matchesPlayed = 0;

    public UserSeasonRating() {
        super();
    }

    public UserSeasonRating(User user, RankedSeason season, Integer rating, String tier) {
        this.user = user;
        this.season = season;
        this.rating = rating;
        this.peakRating = rating;
        this.tier = tier;
        this.wins = 0;
        this.losses = 0;
        this.matchesPlayed = 0;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public RankedSeason getSeason() {
        return season;
    }

    public void setSeason(RankedSeason season) {
        this.season = season;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public Integer getPeakRating() {
        return peakRating;
    }

    public void setPeakRating(Integer peakRating) {
        this.peakRating = peakRating;
    }

    public String getTier() {
        return tier;
    }

    public void setTier(String tier) {
        this.tier = tier;
    }

    public String getPreviousSeasonTier() {
        return previousSeasonTier;
    }

    public void setPreviousSeasonTier(String previousSeasonTier) {
        this.previousSeasonTier = previousSeasonTier;
    }

    public Integer getWins() {
        return wins;
    }

    public void setWins(Integer wins) {
        this.wins = wins;
    }

    public Integer getLosses() {
        return losses;
    }

    public void setLosses(Integer losses) {
        this.losses = losses;
    }

    public Integer getMatchesPlayed() {
        return matchesPlayed;
    }

    public void setMatchesPlayed(Integer matchesPlayed) {
        this.matchesPlayed = matchesPlayed;
    }
}
