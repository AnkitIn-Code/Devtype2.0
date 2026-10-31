package com.devtype.leaderboard.service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.slf4j.*;
@Component
public class SeasonScheduler {
    private static final Logger log=LoggerFactory.getLogger(SeasonScheduler.class);
    private final LeaderboardService leaderboard;
    public SeasonScheduler(LeaderboardService leaderboard) { this.leaderboard=leaderboard; }
    @Scheduled(fixedDelay=30000, initialDelay=30000)
    public void rollover() {
        try { leaderboard.endSeasonAndResetTiers(); }
        catch(Exception e) { log.error("Season rollover transaction failed; will retry: {}",e.getClass().getSimpleName()); }
    }
}
