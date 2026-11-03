-- Migration: V13__cleanup_admin_anti_cheat_tickets.sql
-- Removes accidental self-flagged anti-cheat tickets filed against platform administrators

DELETE FROM user_reports
WHERE category = 'AUTOMATED_CHEAT_DETECTION'
  AND reported_user_id IN (SELECT id FROM app_users WHERE role = 'ADMIN');
