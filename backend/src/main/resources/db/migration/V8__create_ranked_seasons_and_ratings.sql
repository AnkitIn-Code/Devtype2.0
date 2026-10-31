-- ==============================================================================
-- DevType Ranked Seasons & Competitive Ratings Migration: V8__create_ranked_seasons_and_ratings.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Ranked Seasons Table (Stores current active season and previous season only)
-- ------------------------------------------------------------------------------
CREATE TABLE ranked_seasons (
    id BIGSERIAL PRIMARY KEY,
    season_number INTEGER NOT NULL,
    season_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    champion_user_id BIGINT,
    champion_name VARCHAR(100),
    champion_username VARCHAR(50),
    champion_rating INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    CONSTRAINT uq_ranked_seasons_number UNIQUE (season_number),
    CONSTRAINT fk_seasons_champion FOREIGN KEY (champion_user_id) REFERENCES app_users(id) ON DELETE SET NULL,
    CONSTRAINT chk_seasons_status CHECK (status IN ('ACTIVE', 'ENDED'))
);

CREATE INDEX idx_seasons_status ON ranked_seasons (status);
CREATE INDEX idx_seasons_number ON ranked_seasons (season_number);

-- ------------------------------------------------------------------------------
-- 2. User Season Ratings Table (Stores per-season competitive ratings & BGMI tiers)
-- ------------------------------------------------------------------------------
CREATE TABLE user_season_ratings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    season_id BIGINT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 1200,
    peak_rating INTEGER NOT NULL DEFAULT 1200,
    tier VARCHAR(50) NOT NULL DEFAULT 'Bronze V',
    previous_season_tier VARCHAR(50),
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    matches_played INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    CONSTRAINT uq_user_season_rating UNIQUE (user_id, season_id),
    CONSTRAINT fk_user_season_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_season_season FOREIGN KEY (season_id) REFERENCES ranked_seasons(id) ON DELETE CASCADE,
    CONSTRAINT chk_ratings_positive CHECK (rating >= 0 AND peak_rating >= rating),
    CONSTRAINT chk_matches_non_negative CHECK (wins >= 0 AND losses >= 0 AND matches_played >= 0)
);

CREATE INDEX idx_user_season_rating_season ON user_season_ratings (season_id, rating DESC);
CREATE INDEX idx_user_season_rating_user ON user_season_ratings (user_id);

-- ------------------------------------------------------------------------------
-- 3. Seed Initial Season 1 (Active) and Season 0 (Previous Season Champion)
-- ------------------------------------------------------------------------------
INSERT INTO ranked_seasons (season_number, season_name, status, starts_at, ends_at, champion_name, champion_username, champion_rating, created_at)
SELECT 0, 'Season 0: Alpha Invitational', 'ENDED', CURRENT_TIMESTAMP - INTERVAL '40' DAY, CURRENT_TIMESTAMP - INTERVAL '10' DAY, 'Alex Mercer', 'demo_ace', 4280, CURRENT_TIMESTAMP - INTERVAL '40' DAY
WHERE NOT EXISTS (SELECT 1 FROM ranked_seasons WHERE season_number = 0);

INSERT INTO ranked_seasons (season_number, season_name, status, starts_at, ends_at, champion_name, champion_username, champion_rating, created_at)
SELECT 1, 'Season 1: Apex Velocity', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '10' DAY, CURRENT_TIMESTAMP + INTERVAL '20' DAY, NULL, NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '10' DAY
WHERE NOT EXISTS (SELECT 1 FROM ranked_seasons WHERE season_number = 1);

-- Seed initial ratings for demo users in Season 1 if they exist
INSERT INTO user_season_ratings (user_id, season_id, rating, peak_rating, tier, previous_season_tier, wins, losses, matches_played, created_at)
SELECT u.id, s.id, 
       CASE 
         WHEN u.username = 'demo_ace' THEN 3980
         WHEN u.username = 'demo_consistent' THEN 2740
         WHEN u.username = 'demo_beginner' THEN 1620
         ELSE 1200 
       END,
       CASE 
         WHEN u.username = 'demo_ace' THEN 4050
         WHEN u.username = 'demo_consistent' THEN 2810
         WHEN u.username = 'demo_beginner' THEN 1680
         ELSE 1200 
       END,
       CASE 
         WHEN u.username = 'demo_ace' THEN 'Crown I'
         WHEN u.username = 'demo_consistent' THEN 'Platinum III'
         WHEN u.username = 'demo_beginner' THEN 'Silver III'
         ELSE 'Bronze V' 
       END,
       CASE 
         WHEN u.username = 'demo_ace' THEN 'Ace'
         WHEN u.username = 'demo_consistent' THEN 'Diamond I'
         WHEN u.username = 'demo_beginner' THEN 'Silver I'
         ELSE 'Bronze V' 
       END,
       CASE 
         WHEN u.username = 'demo_ace' THEN 148
         WHEN u.username = 'demo_consistent' THEN 92
         WHEN u.username = 'demo_beginner' THEN 34
         ELSE 0 
       END,
       CASE 
         WHEN u.username = 'demo_ace' THEN 18
         WHEN u.username = 'demo_consistent' THEN 38
         WHEN u.username = 'demo_beginner' THEN 30
         ELSE 0 
       END,
       CASE 
         WHEN u.username = 'demo_ace' THEN 166
         WHEN u.username = 'demo_consistent' THEN 130
         WHEN u.username = 'demo_beginner' THEN 64
         ELSE 0 
       END,
       CURRENT_TIMESTAMP
FROM app_users u
CROSS JOIN ranked_seasons s
WHERE s.season_number = 1
  AND NOT EXISTS (
      SELECT 1 FROM user_season_ratings usr WHERE usr.user_id = u.id AND usr.season_id = s.id
  );
