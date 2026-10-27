-- ==============================================================================
-- DevType Core Schema Migration: V3__create_admin_audit_logs.sql
-- Administrative audit logs and report moderation extensions
-- ==============================================================================

-- 1. Create append-only administrative audit log table
CREATE TABLE admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT,
    previous_state VARCHAR(255),
    new_state VARCHAR(255),
    reason TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_audit_logs_admin FOREIGN KEY (admin_user_id) REFERENCES app_users(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_logs_admin_id ON admin_audit_logs (admin_user_id);
CREATE INDEX idx_audit_logs_action_type ON admin_audit_logs (action_type);
CREATE INDEX idx_audit_logs_target ON admin_audit_logs (target_type, target_id);
CREATE INDEX idx_audit_logs_created_at ON admin_audit_logs (created_at DESC);

-- 2. Add resolution_note to user_reports for moderation context
ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS resolution_note TEXT;
