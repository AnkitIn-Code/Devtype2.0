// src/utils/sessionSync.js
import { getSavedSessions, saveUserSession } from './reportStore';

/**
 * Normalizes any session object into a standard representation with consistent property names.
 */
export function normalizeSession(session) {
  if (!session) return null;
  const dateStr = session.completedAt || session.date || session.startedAt || new Date().toISOString();
  const netWpm = Math.round(Number(session.netWpm ?? session.wpm ?? 0));
  const grossWpm = Math.round(Number(session.grossWpm ?? netWpm));
  const accuracy = Math.round(Number(session.accuracyPercent ?? session.accuracy ?? 100));
  const durationSec = Math.round(Number(session.durationSeconds ?? (session.durationMs ? session.durationMs / 1000 : 0)));
  const title = session.templateTitle || session.snippetTitle || session.title || 'Practice Sprint';
  const lang = session.language || 'Code';
  const diff = session.difficulty || 'Intermediate';

  return {
    ...session,
    id: String(session.id || `sess_${Date.now()}`),
    date: dateStr,
    completedAt: dateStr,
    wpm: netWpm,
    netWpm,
    grossWpm,
    accuracy,
    accuracyPercent: accuracy,
    durationSeconds: durationSec,
    durationMs: durationSec * 1000,
    title,
    snippetTitle: title,
    templateTitle: title,
    language: lang,
    difficulty: diff,
    errors: session.errors ?? session.errorCount ?? 0,
    totalCharacters: session.totalCharacters ?? (netWpm * 5),
  };
}

/**
 * Merges server and local storage sessions without duplicates, preserving detailed telemetry.
 * Returns sorted list (newest first).
 */
export function mergeSessions(serverSessions = [], localSessions = []) {
  const mergedMap = new Map();

  // 1. Add server sessions
  (serverSessions || []).forEach((raw) => {
    const s = normalizeSession(raw);
    if (s && s.id) {
      mergedMap.set(s.id, s);
    }
  });

  // 2. Add local sessions with deduplication
  (localSessions || []).forEach((raw) => {
    const l = normalizeSession(raw);
    if (!l) return;

    // Check if matching by explicit ID
    if (mergedMap.has(l.id)) {
      const existing = mergedMap.get(l.id);
      mergedMap.set(l.id, { ...existing, ...l });
      return;
    }

    // Check if matching by serverSessionId or timestamp proximity (within 5 seconds)
    let matchedId = null;
    if (l.serverSessionId && mergedMap.has(String(l.serverSessionId))) {
      matchedId = String(l.serverSessionId);
    } else {
      const lTime = new Date(l.date).getTime();
      for (const [sId, s] of mergedMap.entries()) {
        const sTime = new Date(s.date).getTime();
        if (Math.abs(lTime - sTime) < 5000 && (s.templateTitle === l.templateTitle || s.language === l.language)) {
          matchedId = sId;
          break;
        }
      }
    }

    if (matchedId) {
      const existing = mergedMap.get(matchedId);
      mergedMap.set(matchedId, { ...existing, ...l, id: matchedId });
    } else {
      mergedMap.set(l.id, l);
    }
  });

  const list = Array.from(mergedMap.values());
  list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return list;
}

/**
 * Extracts a local 'YYYY-MM-DD' date string from an ISO timestamp or Date.
 */
export function toLocalDateString(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extracts a UTC 'YYYY-MM-DD' date string.
 */
export function toUtcDateString(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes heatmap intensity level (0..4) based on session count.
 */
export function computeHeatmapLevel(sessions) {
  if (!sessions || sessions <= 0) return 0;
  if (sessions <= 2) return 1;
  if (sessions <= 4) return 2;
  if (sessions <= 7) return 3;
  return 4;
}

/**
 * Generates unified daily activity points, guaranteeing that all completed sessions
 * are represented in both Dashboard and Profile heatmaps.
 */
export function buildUnifiedDailyActivity(serverDailyActivity = [], allSessions = []) {
  const activityMap = new Map();

  // 1. Initialize from server daily activity points
  (serverDailyActivity || []).forEach((pt) => {
    if (pt && pt.date) {
      activityMap.set(pt.date, {
        date: pt.date,
        sessionCount: pt.sessionCount || 0,
        totalPracticeSeconds: pt.totalPracticeSeconds || 0,
        totalCharacters: pt.totalCharacters || 0,
        level: pt.level ?? computeHeatmapLevel(pt.sessionCount),
      });
    }
  });

  // 2. Aggregate from all completed sessions
  const sessionDatesCount = new Map();
  const sessionDuration = new Map();
  const sessionChars = new Map();

  (allSessions || []).forEach((s) => {
    const rawDate = s.completedAt || s.date || s.startedAt;
    const localDateStr = toLocalDateString(rawDate);
    const utcDateStr = toUtcDateString(rawDate);

    // Track for both local and UTC date anchors
    [localDateStr, utcDateStr].filter(Boolean).forEach((dateKey) => {
      sessionDatesCount.set(dateKey, (sessionDatesCount.get(dateKey) || 0) + 1);
      sessionDuration.set(dateKey, (sessionDuration.get(dateKey) || 0) + (s.durationSeconds || 60));
      sessionChars.set(dateKey, (sessionChars.get(dateKey) || 0) + (s.totalCharacters || 100));
    });
  });

  // Merge session dates into activityMap
  sessionDatesCount.forEach((count, dateKey) => {
    const existing = activityMap.get(dateKey);
    const addSecs = sessionDuration.get(dateKey) || 0;
    const addChars = sessionChars.get(dateKey) || 0;

    if (existing) {
      const mergedCount = Math.max(existing.sessionCount, count);
      activityMap.set(dateKey, {
        date: dateKey,
        sessionCount: mergedCount,
        totalPracticeSeconds: Math.max(existing.totalPracticeSeconds, addSecs),
        totalCharacters: Math.max(existing.totalCharacters, addChars),
        level: computeHeatmapLevel(mergedCount),
      });
    } else {
      activityMap.set(dateKey, {
        date: dateKey,
        sessionCount: count,
        totalPracticeSeconds: addSecs,
        totalCharacters: addChars,
        level: computeHeatmapLevel(count),
      });
    }
  });

  const list = Array.from(activityMap.values());
  list.sort((a, b) => a.date.localeCompare(b.date));
  return list;
}

/**
 * Calculates current streak accurately by analyzing consecutive active dates.
 * Combines server streak telemetry with local completed sessions.
 */
export function calculateConsistentStreak(serverStreak = 0, serverDailyActivity = [], allSessions = []) {
  const activeDates = new Set();

  // 1. Dates with recorded activity from server
  (serverDailyActivity || []).forEach((pt) => {
    if (pt && pt.sessionCount > 0 && pt.date) {
      activeDates.add(pt.date);
    }
  });

  // 2. Dates from all sessions
  (allSessions || []).forEach((s) => {
    const rawDate = s.completedAt || s.date || s.startedAt;
    const localD = toLocalDateString(rawDate);
    const utcD = toUtcDateString(rawDate);
    if (localD) activeDates.add(localD);
    if (utcD) activeDates.add(utcD);
  });

  if (activeDates.size === 0) {
    return Math.max(0, Number(serverStreak) || 0);
  }

  const todayLocal = toLocalDateString(new Date());
  const todayUtc = toUtcDateString(new Date());

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayLocal = toLocalDateString(yesterdayDate);
  const yesterdayUtc = toUtcDateString(yesterdayDate);

  // Check if today or yesterday has activity
  let pointerDate = null;
  if (activeDates.has(todayLocal) || activeDates.has(todayUtc)) {
    pointerDate = new Date();
  } else if (activeDates.has(yesterdayLocal) || activeDates.has(yesterdayUtc)) {
    pointerDate = yesterdayDate;
  }

  let streak = 0;
  if (pointerDate) {
    const checkDate = new Date(pointerDate.getTime());
    while (true) {
      const locKey = toLocalDateString(checkDate);
      const utcKey = toUtcDateString(checkDate);
      if (activeDates.has(locKey) || activeDates.has(utcKey)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return Math.max(Number(serverStreak) || 0, streak);
}

/**
 * Atomically saves completed session, synchronizes local cache, and notifies all listening views.
 */
export function syncCompletedSession(session, userId) {
  if (!session) return;
  const normalized = normalizeSession(session);
  saveUserSession(normalized, userId);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('devtype_session_completed', { detail: normalized }));
    window.dispatchEvent(new CustomEvent('storage', { detail: { key: `devtype_sessions_${userId}` } }));
  }
  return normalized;
}
