-- ==============================================================================
-- DevType Core Schema Migration: V1__create_core_schema.sql
-- PostgreSQL / Neon Relational Schema for Multi-User Code Typing Practice Platform
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. App Users Table
-- ------------------------------------------------------------------------------
CREATE TABLE app_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    display_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(512),
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    account_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('USER', 'ADMIN')),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
    CONSTRAINT chk_users_account_type CHECK (account_type IN ('STANDARD', 'DEMO'))
);

CREATE INDEX idx_users_username ON app_users (username);
CREATE INDEX idx_users_email ON app_users (email);
CREATE INDEX idx_users_status ON app_users (status);

-- ------------------------------------------------------------------------------
-- 2. User Preferences Table (1:1 with app_users)
-- ------------------------------------------------------------------------------
CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    theme VARCHAR(50) NOT NULL DEFAULT 'dark',
    default_language VARCHAR(50) NOT NULL DEFAULT 'javascript',
    default_difficulty VARCHAR(50) NOT NULL DEFAULT 'INTERMEDIATE',
    sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,
    CONSTRAINT uq_user_preferences_user_id UNIQUE (user_id),
    CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT chk_user_preferences_difficulty CHECK (default_difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED'))
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences (user_id);

-- ------------------------------------------------------------------------------
-- 3. Practice Templates Table (Shared platform catalog)
-- ------------------------------------------------------------------------------
CREATE TABLE practice_templates (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    description TEXT,
    language VARCHAR(50) NOT NULL,
    difficulty VARCHAR(30) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    estimated_duration_seconds INTEGER NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,
    CONSTRAINT uq_templates_slug UNIQUE (slug),
    CONSTRAINT chk_templates_difficulty CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    CONSTRAINT chk_templates_duration CHECK (estimated_duration_seconds > 0)
);

CREATE INDEX idx_templates_slug ON practice_templates (slug);
CREATE INDEX idx_templates_language ON practice_templates (language);
CREATE INDEX idx_templates_difficulty ON practice_templates (difficulty);
CREATE INDEX idx_templates_category ON practice_templates (category);
CREATE INDEX idx_templates_is_published ON practice_templates (is_published);

-- ------------------------------------------------------------------------------
-- 4. Practice Sessions Table (Historical typing results per user)
-- ------------------------------------------------------------------------------
CREATE TABLE practice_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    template_id BIGINT,
    template_title_snapshot VARCHAR(150) NOT NULL,
    language_snapshot VARCHAR(50) NOT NULL,
    difficulty_snapshot VARCHAR(50) NOT NULL,
    source_content_snapshot TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_ms BIGINT NOT NULL,
    gross_wpm NUMERIC(6, 2) NOT NULL,
    net_wpm NUMERIC(6, 2) NOT NULL,
    accuracy_percent NUMERIC(5, 2) NOT NULL,
    correct_characters INTEGER NOT NULL,
    incorrect_characters INTEGER NOT NULL,
    total_characters INTEGER NOT NULL,
    error_count INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_sessions_template FOREIGN KEY (template_id) REFERENCES practice_templates(id) ON DELETE SET NULL,
    CONSTRAINT chk_sessions_status CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')),
    CONSTRAINT chk_sessions_duration CHECK (duration_ms >= 0),
    CONSTRAINT chk_sessions_gross_wpm CHECK (gross_wpm >= 0),
    CONSTRAINT chk_sessions_net_wpm CHECK (net_wpm >= 0),
    CONSTRAINT chk_sessions_accuracy CHECK (accuracy_percent >= 0.00 AND accuracy_percent <= 100.00),
    CONSTRAINT chk_sessions_characters CHECK (correct_characters >= 0 AND incorrect_characters >= 0 AND total_characters >= 0),
    CONSTRAINT chk_sessions_errors CHECK (error_count >= 0)
);

CREATE INDEX idx_sessions_user_id ON practice_sessions (user_id);
CREATE INDEX idx_sessions_started_at ON practice_sessions (started_at);
CREATE INDEX idx_sessions_status ON practice_sessions (status);
CREATE INDEX idx_sessions_template_id ON practice_sessions (template_id);
CREATE INDEX idx_sessions_user_started ON practice_sessions (user_id, started_at DESC);

-- ------------------------------------------------------------------------------
-- 5. Daily Practice Activity Table (Heatmap telemetry)
-- ------------------------------------------------------------------------------
CREATE TABLE daily_practice_activity (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    activity_date DATE NOT NULL,
    session_count INTEGER NOT NULL DEFAULT 0,
    total_practice_seconds BIGINT NOT NULL DEFAULT 0,
    total_characters INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,
    CONSTRAINT uq_daily_activity_user_date UNIQUE (user_id, activity_date),
    CONSTRAINT fk_daily_activity_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT chk_activity_session_count CHECK (session_count >= 0),
    CONSTRAINT chk_activity_practice_seconds CHECK (total_practice_seconds >= 0),
    CONSTRAINT chk_activity_characters CHECK (total_characters >= 0)
);

CREATE INDEX idx_daily_activity_user_date ON daily_practice_activity (user_id, activity_date);

-- ------------------------------------------------------------------------------
-- 6. Achievements Table (Shared platform catalog)
-- ------------------------------------------------------------------------------
CREATE TABLE achievements (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    threshold INTEGER,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_achievements_code UNIQUE (code),
    CONSTRAINT chk_achievements_threshold CHECK (threshold IS NULL OR threshold >= 0)
);

CREATE INDEX idx_achievements_code ON achievements (code);
CREATE INDEX idx_achievements_category ON achievements (category);

-- ------------------------------------------------------------------------------
-- 7. User Achievements Table (User-unlocked badges)
-- ------------------------------------------------------------------------------
CREATE TABLE user_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    achievement_id BIGINT NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL,
    progress INTEGER,
    CONSTRAINT uq_user_achievements_user_achievement UNIQUE (user_id, achievement_id),
    CONSTRAINT fk_user_achievements_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_achievements_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    CONSTRAINT chk_user_achievements_progress CHECK (progress IS NULL OR progress >= 0)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements (user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements (achievement_id);

-- ------------------------------------------------------------------------------
-- 8. User Reports Table (Platform moderation reports)

-- ------------------------------------------------------------------------------
CREATE TABLE user_reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_user_id BIGINT NOT NULL,
    reported_user_id BIGINT,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    reviewed_by_user_id BIGINT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_reported FOREIGN KEY (reported_user_id) REFERENCES app_users(id) ON DELETE SET NULL,
    CONSTRAINT fk_reports_reviewer FOREIGN KEY (reviewed_by_user_id) REFERENCES app_users(id) ON DELETE SET NULL,
    CONSTRAINT chk_reports_status CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'))
);

CREATE INDEX idx_reports_reporter ON user_reports (reporter_user_id);
CREATE INDEX idx_reports_reported ON user_reports (reported_user_id);
CREATE INDEX idx_reports_reviewer ON user_reports (reviewed_by_user_id);
CREATE INDEX idx_reports_status ON user_reports (status);
