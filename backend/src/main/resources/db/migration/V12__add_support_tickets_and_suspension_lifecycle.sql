-- Migration: V12__add_support_tickets_and_suspension_lifecycle.sql
-- Description: Adds support ticket attributes, moderation cheat flags, admin response,
--              and user account suspension/deactivation lifecycle columns.

-- 1. Support & Moderation ticket enhancements on user_reports
ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS title VARCHAR(150);
ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS priority VARCHAR(30) DEFAULT 'NORMAL';
ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS is_system_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS admin_response TEXT;

-- 2. User account suspension timer and deactivation deletion lifecycle
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMPTZ;

-- 3. Indexes for efficient filtering and automated jobs
CREATE INDEX IF NOT EXISTS idx_reports_system_flagged ON user_reports (is_system_flagged);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON user_reports (priority);
CREATE INDEX IF NOT EXISTS idx_users_suspended_until ON app_users (suspended_until);
CREATE INDEX IF NOT EXISTS idx_users_scheduled_deletion ON app_users (scheduled_deletion_at);
