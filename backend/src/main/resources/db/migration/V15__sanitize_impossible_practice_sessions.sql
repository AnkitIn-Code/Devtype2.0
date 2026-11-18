-- Migration: V15__sanitize_impossible_practice_sessions.sql
-- Invalidates any session exceeding the maximum plausible human code typing speed (200 WPM)
-- so they do not distort verified user statistics, best WPM, or leaderboards.

UPDATE practice_sessions
SET status = 'ABANDONED'
WHERE net_wpm > 200.00;
