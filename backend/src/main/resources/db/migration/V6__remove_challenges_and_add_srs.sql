-- ==============================================================================
-- DevType Schema Migration: V6__remove_challenges_and_add_srs.sql
-- Remove deprecated challenge entities and add Spaced Repetition (SRS) schema
-- ==============================================================================

-- 1. Drop challenge attempts and challenges tables completely
DROP TABLE IF EXISTS challenge_attempts CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;

-- 2. Create Spaced Repetition (SRS) cards table
CREATE TABLE IF NOT EXISTS srs_cards (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    snippet_id VARCHAR(150) NOT NULL,
    snippet_title VARCHAR(200) NOT NULL,
    language VARCHAR(50) NOT NULL,
    repetition INTEGER NOT NULL DEFAULT 0,
    ease_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.50,
    interval_days INTEGER NOT NULL DEFAULT 1,
    due_date TIMESTAMPTZ NOT NULL,
    last_reviewed_at TIMESTAMPTZ,
    last_quality_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,
    CONSTRAINT uq_srs_user_snippet UNIQUE (user_id, snippet_id),
    CONSTRAINT fk_srs_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT chk_srs_repetition CHECK (repetition >= 0),
    CONSTRAINT chk_srs_ease_factor CHECK (ease_factor >= 1.30),
    CONSTRAINT chk_srs_interval_days CHECK (interval_days >= 0),
    CONSTRAINT chk_srs_quality_score CHECK (last_quality_score >= 0 AND last_quality_score <= 5)
);

CREATE INDEX IF NOT EXISTS idx_srs_user_due ON srs_cards (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_srs_snippet ON srs_cards (snippet_id);
