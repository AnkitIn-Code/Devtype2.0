-- Migration: V14__add_practice_shortcuts_to_user_preferences.sql
-- Adds persistent user-scoped practice shortcuts to user_preferences

ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS practice_shortcuts TEXT;
