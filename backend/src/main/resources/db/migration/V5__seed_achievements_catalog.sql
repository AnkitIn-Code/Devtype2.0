-- Seed core platform achievement definitions for developer milestone progression
INSERT INTO achievements (code, name, description, icon, category, threshold, created_at) VALUES
-- Speed Category
('speed-40', 'Typing Apprentice', 'Reach a typing speed of 40 WPM on any standard code snippet.', 'Zap', 'Speed', 40, CURRENT_TIMESTAMP),
('speed-60', 'Baseline Velocity', 'Reach a typing speed of 60 WPM on any standard code snippet.', 'Zap', 'Speed', 60, CURRENT_TIMESTAMP),
('speed-80', 'Swift Syntax', 'Surpass 80 WPM on an intermediate algorithmic problem.', 'Zap', 'Speed', 80, CURRENT_TIMESTAMP),
('speed-100', 'Centurion Velocity', 'Hit triple digits: Achieve 100 WPM on any verified practice run.', 'Zap', 'Speed', 100, CURRENT_TIMESTAMP),
('speed-120', 'Overclocked Fingers', 'Break the 120 WPM barrier on complex code.', 'Flame', 'Speed', 120, CURRENT_TIMESTAMP),
('speed-140', 'Hyperscale Typist', 'Clock 140 WPM or higher on an authentic snippet.', 'Crown', 'Speed', 140, CURRENT_TIMESTAMP),

-- Volume / Sessions Category
('first-session', 'First Keystrokes', 'Complete your very first code typing practice session.', 'Play', 'Volume', 1, CURRENT_TIMESTAMP),
('tests-5', 'Code Explorer', 'Complete 5 practice sessions across any languages.', 'Play', 'Volume', 5, CURRENT_TIMESTAMP),
('tests-10', 'First Commits', 'Complete 10 typing sessions across any languages.', 'Play', 'Volume', 10, CURRENT_TIMESTAMP),
('tests-25', 'Dedicated Practitioner', 'Log 25 completed code practice sessions.', 'FileCode', 'Volume', 25, CURRENT_TIMESTAMP),
('tests-50', 'Habit Forming', 'Successfully log 50 completed practice sessions.', 'Award', 'Volume', 50, CURRENT_TIMESTAMP),
('tests-100', 'Century Milestone', 'Record 100 practice sessions in your history.', 'Trophy', 'Volume', 100, CURRENT_TIMESTAMP),
('tests-250', 'Endurance Hacker', 'Log 250 verified code typing benchmarks.', 'Sparkles', 'Volume', 250, CURRENT_TIMESTAMP),

-- Characters Typed Category
('chars-1000', 'Code Kilobyte', 'Type over 1,000 characters in verified practice sessions.', 'Terminal', 'Characters', 1000, CURRENT_TIMESTAMP),
('chars-5000', 'Source Code Crafter', 'Type over 5,000 total code characters.', 'Cpu', 'Characters', 5000, CURRENT_TIMESTAMP),
('chars-25000', 'Syntax Architect', 'Type over 25,000 total code characters.', 'Layers', 'Characters', 25000, CURRENT_TIMESTAMP),

-- Precision & Accuracy Category
('accuracy-95', 'Clean Buffer', 'Complete a practice session with 95% or higher accuracy.', 'Shield', 'Precision', 95, CURRENT_TIMESTAMP),
('accuracy-98', 'High Precision', 'Complete a practice session with 98% or higher accuracy.', 'Target', 'Precision', 98, CURRENT_TIMESTAMP),
('accuracy-100', 'Perfectionist', 'Complete a session with 100% flawless accuracy and zero typos.', 'Target', 'Precision', 100, CURRENT_TIMESTAMP),

-- Consistency / Streaks Category
('streak-2', 'Spark of Habit', 'Maintain a 2-day consecutive typing practice streak.', 'Flame', 'Consistency', 2, CURRENT_TIMESTAMP),
('streak-7', 'Weekly Habit', 'Maintain a 7-day practice streak.', 'Flame', 'Consistency', 7, CURRENT_TIMESTAMP),
('streak-14', 'Fortnight Focus', 'Maintain a 14-day consecutive practice streak.', 'Flame', 'Consistency', 14, CURRENT_TIMESTAMP),
('streak-30', 'Iron Discipline', 'Maintain a 30-day consecutive practice streak.', 'Crown', 'Consistency', 30, CURRENT_TIMESTAMP),

-- Spaced Repetition (SRS) Category
('first-srs-review', 'Synaptic Initiator', 'Complete your first spaced repetition active recall review.', 'Brain', 'SRS', 1, CURRENT_TIMESTAMP),
('srs-reviews-5', 'Recall Master', 'Complete 5 spaced repetition active recall reviews.', 'Trophy', 'SRS', 5, CURRENT_TIMESTAMP),
('srs-reviews-15', 'Algorithmic Retention', 'Complete 15 spaced repetition active recall reviews.', 'Crown', 'SRS', 15, CURRENT_TIMESTAMP),

-- Languages Category
('lang-polyglot-2', 'Bilingual Developer', 'Complete sessions in at least 2 different programming languages.', 'Globe', 'Languages', 2, CURRENT_TIMESTAMP),
('lang-polyglot-4', 'Polyglot Engineer', 'Complete sessions in at least 4 different programming languages.', 'Globe', 'Languages', 4, CURRENT_TIMESTAMP);

