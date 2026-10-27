-- ==============================================================================
-- DevType Core Schema Migration: V2__add_xp_ledger_and_user_xp.sql
-- Add total_xp to app_users and immutable xp_transactions ledger
-- ==============================================================================

-- 1. Add total_xp column to app_users
ALTER TABLE app_users ADD COLUMN total_xp BIGINT NOT NULL DEFAULT 0;
ALTER TABLE app_users ADD CONSTRAINT chk_users_total_xp CHECK (total_xp >= 0);

-- 2. Create immutable XP transaction ledger for auditability and idempotency
CREATE TABLE xp_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    amount INTEGER NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_xp_transactions_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT uq_xp_transactions_source UNIQUE (user_id, source_type, source_id),
    CONSTRAINT chk_xp_transactions_amount CHECK (amount >= 0)
);

CREATE INDEX idx_xp_transactions_user_id ON xp_transactions (user_id);
CREATE INDEX idx_xp_transactions_created_at ON xp_transactions (created_at);
