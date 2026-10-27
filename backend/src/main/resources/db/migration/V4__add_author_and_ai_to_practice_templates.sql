-- ------------------------------------------------------------------------------
-- Flyway Migration V4: Add author_id and is_ai_generated to practice_templates
-- Supports user-owned custom and AI-generated practice templates
-- ------------------------------------------------------------------------------

ALTER TABLE practice_templates
    ADD COLUMN IF NOT EXISTS author_id BIGINT;

ALTER TABLE practice_templates
    ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE practice_templates
    ADD CONSTRAINT fk_practice_templates_author
    FOREIGN KEY (author_id) REFERENCES app_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_practice_templates_author_id ON practice_templates(author_id);
CREATE INDEX IF NOT EXISTS idx_practice_templates_is_ai_generated ON practice_templates(is_ai_generated);
