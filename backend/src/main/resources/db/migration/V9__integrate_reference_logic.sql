-- ==============================================================================
-- Flyway Migration V9: Integrate Reference Project SRS & Custom Snippets Logic
-- ==============================================================================

-- 1. Support speed-based SRS mastery and nullable revision intervals
ALTER TABLE srs_cards ADD COLUMN IF NOT EXISTS is_mastered BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE srs_cards ALTER COLUMN interval_days DROP NOT NULL;
ALTER TABLE srs_cards ALTER COLUMN due_date DROP NOT NULL;

-- 2. Create Custom Snippets & Catalog Templates table
CREATE TABLE IF NOT EXISTS snippets (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(150),
    description TEXT,
    language VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Custom',
    sub_category VARCHAR(100),
    difficulty VARCHAR(30) NOT NULL DEFAULT 'INTERMEDIATE',
    code TEXT NOT NULL,
    tags VARCHAR(255),
    is_curated BOOLEAN NOT NULL DEFAULT FALSE,
    is_custom BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id BIGINT,
    xp_bounty INTEGER NOT NULL DEFAULT 40,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_snippets_user FOREIGN KEY (created_by_user_id) REFERENCES app_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_snippets_slug ON snippets(slug);
CREATE INDEX IF NOT EXISTS idx_snippets_user ON snippets(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_snippets_curated ON snippets(is_curated);
