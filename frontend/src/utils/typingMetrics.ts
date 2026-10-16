// src/utils/typingMetrics.ts

/**
 * Input statistics collected during a typing session.
 */
export interface TypingInputStats {
  /** Total keystrokes entered (including correct, errors, and backspaces) */
  totalKeystrokes: number;
  /** Number of characters typed correctly matching the reference text */
  correctChars: number;
  /** Cumulative count of all mistakes made throughout the session */
  totalErrors: number;
  /** Currently uncorrected mistakes at the current position */
  uncorrectedErrors: number;
  /** Total elapsed time in milliseconds */
  elapsedMs: number;
  /** Total characters in the reference snippet */
  totalSnippetChars: number;
  /** Current 0-based cursor position in the snippet */
  currentCursorIndex: number;
}

/**
 * Calculated live and final metrics for the typing session.
 */
export interface TypingMetrics {
  /**
   * Gross Words Per Minute.
   * Standard typographic formula: (totalKeystrokes / 5) / (elapsedMinutes)
   */
  grossWpm: number;

  /**
   * Net Words Per Minute.
   * Standard scoring formula: Math.max(0, ((correctChars / 5) - uncorrectedErrors) / elapsedMinutes)
   * Prevents inflated scores when skipping or making errors.
   */
  netWpm: number;

  /**
   * Keystroke accuracy percentage [0 - 100].
   * Formula: totalKeystrokes > 0 ? Math.round(((totalKeystrokes - totalErrors) / totalKeystrokes) * 100) : 100
   * Accounts for all incorrect attempts, rewarding precision.
   */
  accuracy: number;

  /** Total number of mistakes made across the entire session */
  errorCount: number;

  /** Elapsed time formatted as "M:SS" or "0:SS" */
  formattedTime: string;

  /** Total elapsed time in seconds with 1 decimal place */
  elapsedSeconds: number;

  /** Percentage of snippet completed [0 - 100] */
  progressPercent: number;

  /** Characters remaining to be typed */
  charsRemaining: number;

  /** Indicates whether the entire snippet has been completed */
  isComplete: boolean;
}

/**
 * Format milliseconds into human-readable M:SS format.
 * Prevents negative values and handles 0 gracefully.
 */
export function formatElapsedTime(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate typing metrics from session inputs.
 * Strictly guards against invalid divisions, negative values, and NaN.
 */
export function calculateTypingMetrics(stats: TypingInputStats): TypingMetrics {
  const {
    totalKeystrokes,
    correctChars,
    totalErrors,
    uncorrectedErrors,
    elapsedMs,
    totalSnippetChars,
    currentCursorIndex,
  } = stats;

  const elapsedSeconds = Math.max(0, elapsedMs / 1000);
  const elapsedMinutes = elapsedSeconds / 60;

  // Guard: When no time has elapsed or no characters have been typed yet
  let grossWpm = 0;
  let netWpm = 0;

  if (elapsedMinutes > 0 && totalKeystrokes > 0) {
    // 1 standard word = 5 keystrokes
    const grossWords = totalKeystrokes / 5;
    grossWpm = Math.round(grossWords / elapsedMinutes);

    // Net WPM penalizes uncorrected errors and only credits correct characters
    const netWords = Math.max(0, (correctChars / 5) - uncorrectedErrors);
    netWpm = Math.round(netWords / elapsedMinutes);
  }

  // Accuracy calculation: percentage of keystrokes that were not errors
  let accuracy = 100;
  if (totalKeystrokes > 0) {
    const validStrokes = Math.max(0, totalKeystrokes - totalErrors);
    accuracy = Math.min(100, Math.max(0, Math.round((validStrokes / totalKeystrokes) * 100)));
  }

  // Progress calculation
  const progressPercent = totalSnippetChars > 0
    ? Math.min(100, Math.round((currentCursorIndex / totalSnippetChars) * 100))
    : 0;

  const charsRemaining = Math.max(0, totalSnippetChars - currentCursorIndex);
  const isComplete = totalSnippetChars > 0 && currentCursorIndex >= totalSnippetChars;

  return {
    grossWpm: Math.max(0, grossWpm),
    netWpm: Math.max(0, netWpm),
    accuracy,
    errorCount: Math.max(0, totalErrors),
    formattedTime: formatElapsedTime(elapsedMs),
    elapsedSeconds: Math.round(elapsedSeconds * 10) / 10,
    progressPercent,
    charsRemaining,
    isComplete,
  };
}

/**
 * Get performance assessment tier and badge based on WPM and Accuracy.
 */
export function getPerformanceTier(wpm: number, accuracy: number): {
  title: string;
  badge: string;
  color: string;
  desc: string;
} {
  if (wpm >= 90 && accuracy >= 97) {
    return {
      title: 'Grandmaster Coder',
      badge: '⚡ Supreme',
      color: '#E11D48',
      desc: 'Blazing speed with near-flawless accuracy. Ready for production under pressure!',
    };
  }
  if (wpm >= 65 && accuracy >= 94) {
    return {
      title: 'Senior Engineer',
      badge: '🚀 Advanced',
      color: '#2563EB',
      desc: 'Fast, smooth typing with high precision. Exceptional muscle memory.',
    };
  }
  if (wpm >= 45 && accuracy >= 90) {
    return {
      title: 'Proficient Developer',
      badge: '🎯 Solid',
      color: '#059669',
      desc: 'Consistent rhythm and good accuracy. Steady progress toward mastery.',
    };
  }
  return {
    title: 'Code Apprentice',
    badge: '🌱 Developing',
    color: '#D97706',
    desc: 'Great start! Focus on hitting each key accurately, and speed will follow naturally.',
  };
}
