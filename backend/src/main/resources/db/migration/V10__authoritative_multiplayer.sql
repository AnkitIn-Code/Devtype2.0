-- One database mutex serializes queue claims, results and season rollover across instances.
CREATE TABLE multiplayer_lock (id INTEGER PRIMARY KEY);
INSERT INTO multiplayer_lock (id) VALUES (1);
CREATE TABLE multiplayer_rooms (
 id VARCHAR(8) PRIMARY KEY,
 state VARCHAR(20) NOT NULL,
 snapshot TEXT NOT NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_multiplayer_rooms_state ON multiplayer_rooms(state);
CREATE TABLE multiplayer_members (
 user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
 room_id VARCHAR(8) NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE
);
CREATE INDEX idx_multiplayer_members_room ON multiplayer_members(room_id);
CREATE TABLE multiplayer_results (
 room_id VARCHAR(8) NOT NULL REFERENCES multiplayer_rooms(id),
 user_id BIGINT NOT NULL REFERENCES app_users(id),
 season_id BIGINT REFERENCES ranked_seasons(id),
 placement INTEGER NOT NULL,
 old_rating INTEGER NOT NULL,
 new_rating INTEGER NOT NULL,
 errors INTEGER NOT NULL,
 score INTEGER NOT NULL,
 mistakes INTEGER NOT NULL,
 elapsed_ms BIGINT,
 completed_at TIMESTAMPTZ NOT NULL,
 PRIMARY KEY(room_id, user_id)
);
CREATE INDEX idx_multiplayer_results_user ON multiplayer_results(user_id, completed_at DESC);
-- A deliberately constrained bug-fix task. Its arithmetic expression is interpreted
-- with bounded operations; no Python runtime, subprocess, network or filesystem access.
CREATE TABLE multiplayer_bug_tasks (
 template_id BIGINT PRIMARY KEY REFERENCES practice_templates(id) ON DELETE CASCADE,
 tests TEXT NOT NULL
);
INSERT INTO practice_templates(title,slug,description,language,difficulty,category,content,estimated_duration_seconds,is_published,created_at)
VALUES('Fix integer addition','multiplayer-fix-addition','Fix add(a, b) to return the sum for positive, negative and zero operands. Supported patch: one return expression using a, b, integers, parentheses, +, -, *, //.', 'Python','BEGINNER','Bug Fix', 'def add(a, b):
    return a - b',180,TRUE,CURRENT_TIMESTAMP);
INSERT INTO multiplayer_bug_tasks(template_id,tests)
SELECT id,'[[2,3,5],[-5,2,-3],[0,0,0],[8,-8,0],[100,200,300],[-9,-3,-12]]' FROM practice_templates WHERE slug='multiplayer-fix-addition';
CREATE TABLE ranked_season_events (
 season_id BIGINT PRIMARY KEY REFERENCES ranked_seasons(id),
 next_season_id BIGINT NOT NULL REFERENCES ranked_seasons(id),
 finalized_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 reset_users INTEGER NOT NULL
);
