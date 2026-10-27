// src/utils/srsEngine.js

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm.
 * Computes next review interval and updated ease factor based on performance quality.
 *
 * @param {number} repetition - Consecutive successful reviews (0-indexed or 1-indexed)
 * @param {number} easeFactor - Multiplier reflecting card difficulty (default 2.5, min 1.3)
 * @param {number} intervalDays - Current interval in days
 * @param {number} quality - Performance score between 0 (complete failure) and 5 (perfect recall)
 */
export function calculateNextSrsReview(repetition = 0, easeFactor = 2.5, intervalDays = 0, quality = 4) {
  let newRepetition = repetition;
  let newEaseFactor = easeFactor;
  let newIntervalDays = intervalDays;

  // Clamp quality between 0 and 5
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  if (q >= 3) {
    // Correct response: advance interval
    if (newRepetition === 0) {
      newIntervalDays = 1;
    } else if (newRepetition === 1) {
      newIntervalDays = 6;
    } else {
      newIntervalDays = Math.round(intervalDays * newEaseFactor);
    }
    newRepetition += 1;
  } else {
    // Incorrect response: reset to beginning
    newRepetition = 0;
    newIntervalDays = 1;
  }

  // Calculate updated Ease Factor:
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEaseFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  // EF cannot fall below 1.3
  newEaseFactor = Math.max(1.3, parseFloat(newEaseFactor.toFixed(2)));

  const now = new Date();
  const nextDueDate = new Date(now.getTime() + newIntervalDays * 24 * 60 * 60 * 1000);

  return {
    repetition: newRepetition,
    easeFactor: newEaseFactor,
    intervalDays: newIntervalDays,
    dueDate: nextDueDate.toISOString(),
    lastReviewedAt: now.toISOString(),
    lastQualityScore: q,
  };
}

/**
 * Computes SM-2 performance quality rating (0-5) from practice session telemetry.
 */
export function deriveQualityScore({ netWpm = 0, accuracy = 100, hintsUsed = 0, practiceMode = 'copy' }) {
  if (accuracy < 80 || netWpm < 20) {
    return 1; // Major difficulty
  }
  if (accuracy < 88 || hintsUsed >= 3) {
    return 2; // Struggled, needed multiple hints
  }
  if (accuracy < 94 || hintsUsed > 0) {
    return 3; // Passed with hesitation/hint
  }
  // In Blind or Cloze mode, achieving high accuracy indicates deeper retention
  const isMasteryMode = practiceMode === 'blind' || practiceMode === 'cloze';
  if (netWpm >= (isMasteryMode ? 65 : 75) && accuracy >= 98 && hintsUsed === 0) {
    return 5; // Flawless master recall
  }
  if (netWpm >= (isMasteryMode ? 45 : 55) && accuracy >= 95) {
    return 4; // Solid recall
  }
  return 3;
}

/**
 * Evaluates whether an SRS card is due for review today.
 */
export function isCardDue(card) {
  if (!card || !card.dueDate) return true;
  return new Date(card.dueDate) <= new Date();
}
