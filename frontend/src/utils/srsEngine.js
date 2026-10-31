// src/utils/srsEngine.js

/**
 * Deterministic rule-based benchmark evaluation (No AI call):
 * Evaluates typing accuracy, error count, and net WPM to compute retention tier and recall schedule:
 * - Tier 4 (Mastered): Flawless recall (accuracy >= 98.5%, errors <= 1, speed >= 65 WPM).
 *   Card remains in Master Deck Registry without urgent recall queue deadline.
 * - Tier 3 (Proficient): Strong retention (accuracy >= 96.0%, errors <= 2, speed >= 40 WPM).
 *   Recall scheduled in 12 to 16 days.
 * - Tier 2 (Developing / "A little good"): Solid progress (accuracy >= 90.0%, errors <= 6, speed >= 25 WPM).
 *   Recall scheduled in 5 to 8 days.
 * - Tier 1 (Struggling / Bad performance): High errors or low accuracy/speed.
 *   Immediate recall scheduled in 1 to 2 days, enters Recall Action Queue on deadline.
 *
 * @param {{ netWpm?: number, accuracy?: number, errorCount?: number }} metrics
 * @returns {{ intervalDays: number|null, isMastered: boolean, qualityScore: number, tierLabel: string, priority: string }}
 */
export function evaluateBenchmarkMatrix({ netWpm = 0, accuracy = 100, errorCount = 0 } = {}) {
  const speed = Math.max(0, Math.round(Number(netWpm) || 0));
  const acc = Math.max(0, Math.min(100, Number(accuracy) || 0));
  const errors = Math.max(0, Math.round(Number(errorCount) || 0));

  // Tier 4: Mastered (Flawless precision and high speed)
  if (acc >= 98.5 && errors <= 1 && speed >= 65) {
    return {
      intervalDays: null,
      isMastered: true,
      qualityScore: 5,
      tierLabel: 'Mastered (Flawless recall, retained in Master Deck)',
      priority: 'mastered',
    };
  }

  // Tier 3: Strong / High Accuracy (10 to 18 days recall)
  if (acc >= 96.0 && errors <= 2 && speed >= 40) {
    const intervalDays = speed >= 55 ? 16 : 12;
    return {
      intervalDays,
      isMastered: false,
      qualityScore: 4,
      tierLabel: `Proficient (${intervalDays} days recall)`,
      priority: 'proficient',
    };
  }

  // Tier 2: Developing / "A little good" (5 to 8 days recall)
  if (acc >= 90.0 && errors <= 6 && speed >= 25) {
    const intervalDays = (acc >= 93.0 && errors <= 3 && speed >= 35) ? 8 : 5;
    return {
      intervalDays,
      isMastered: false,
      qualityScore: 3,
      tierLabel: `Developing (${intervalDays} days recall)`,
      priority: 'developing',
    };
  }

  // Tier 1: Bad / Struggling Performance -> Immediate Recall (1 or 2 days)
  const isSevere = acc < 80.0 || errors >= 10 || speed < 18;
  const intervalDays = isSevere ? 1 : 2;
  return {
    intervalDays,
    isMastered: false,
    qualityScore: isSevere ? 1 : 2,
    tierLabel: `Immediate Recall (${intervalDays} day${intervalDays > 1 ? 's' : ''})`,
    priority: 'urgent',
  };
}

/**
 * Backward compatible helper for speed-based interval.
 */
export function calculateSpeedBasedInterval(netWpm) {
  const benchmark = evaluateBenchmarkMatrix({ netWpm, accuracy: 95, errorCount: 2 });
  return {
    intervalDays: benchmark.intervalDays,
    isMastered: benchmark.isMastered,
    speedTier: benchmark.tierLabel,
  };
}

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm with Deterministic Benchmark Matrix.
 * Computes next review interval and updated ease factor based on accuracy, errors, and net WPM.
 *
 * @param {number} repetition - Consecutive successful reviews (0-indexed or 1-indexed)
 * @param {number} easeFactor - Multiplier reflecting card difficulty (default 2.5, min 1.3)
 * @param {number} intervalDays - Current interval in days
 * @param {number} quality - Performance score between 0 (complete failure) and 5 (perfect recall)
 * @param {number|null} netWpm - Net typing speed
 * @param {number|null} accuracy - Accuracy percentage (0 - 100)
 * @param {number|null} errorCount - Number of typing errors
 */
export function calculateNextSrsReview(
  repetition = 0,
  easeFactor = 2.5,
  intervalDays = 0,
  quality = 4,
  netWpm = null,
  accuracy = null,
  errorCount = null
) {
  let newRepetition = repetition;
  let newEaseFactor = easeFactor || 2.5;

  const benchmark = evaluateBenchmarkMatrix({
    netWpm: netWpm != null ? netWpm : 0,
    accuracy: accuracy != null ? accuracy : (quality >= 4 ? 98 : quality === 3 ? 92 : 80),
    errorCount: errorCount != null ? errorCount : (accuracy != null && accuracy < 90 ? 8 : 1),
  });

  const isMastered = benchmark.isMastered;
  const newIntervalDays = benchmark.intervalDays;
  const q = benchmark.qualityScore;

  if (benchmark.priority === 'urgent') {
    newRepetition = 0; // Reset streak so user is prompted for rapid recall
  } else {
    newRepetition = repetition + 1;
  }

  // Calculate updated Ease Factor:
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEaseFactor = newEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  // EF cannot fall below 1.3
  newEaseFactor = Math.max(1.3, parseFloat(newEaseFactor.toFixed(2)));

  const now = new Date();
  const nextDueDate = (isMastered || newIntervalDays === null)
    ? null
    : benchmark.priority === 'urgent'
      ? now.toISOString() // Due immediately in Recall Action Queue for urgent recall!
      : new Date(now.getTime() + newIntervalDays * 24 * 60 * 60 * 1000).toISOString();

  return {
    repetition: newRepetition,
    easeFactor: newEaseFactor,
    intervalDays: newIntervalDays,
    dueDate: nextDueDate,
    lastReviewedAt: now.toISOString(),
    lastQualityScore: q,
    isMastered,
    speedTier: benchmark.tierLabel,
  };
}

/**
 * Computes SM-2 performance quality rating (0-5) from practice session telemetry.
 */
export function deriveQualityScore({ netWpm = 0, accuracy = 100, hintsUsed = 0, practiceMode = 'copy', errorCount = 0 }) {
  const benchmark = evaluateBenchmarkMatrix({ netWpm, accuracy, errorCount });
  return benchmark.qualityScore;
}

/**
 * Evaluates whether an SRS card is due for review today.
 * Cards marked as mastered or without revision intervals are never due.
 */
export function isCardDue(card) {
  if (!card) return false;
  if (card.isMastered || card.intervalDays === null || card.dueDate === null) return false;
  if (!card.dueDate) return true;
  return new Date(card.dueDate) <= new Date();
}
