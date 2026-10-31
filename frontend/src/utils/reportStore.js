// src/utils/reportStore.js

/**
 * Deterministic baseline session dataset so charts and metrics are mathematically sound,
 * reproducible, and avoid random fluctuations on re-renders.
 */
export const DETERMINISTIC_DEMO_SESSIONS = [
  {
    id: 'demo-s1',
    date: '2026-10-15T10:14:00Z',
    snippetId: 'cpp-lru-cache',
    snippetTitle: 'LRU Cache Implementation',
    language: 'C++',
    difficulty: 'Intermediate',
    wpm: 64,
    grossWpm: 66,
    accuracy: 98,
    errors: 3,
    durationSeconds: 198,
  },
  {
    id: 'demo-s2',
    date: '2026-10-14T16:42:00Z',
    snippetId: 'py-two-sum',
    snippetTitle: 'Two Sum Hash Map',
    language: 'Python',
    difficulty: 'Beginner',
    wpm: 68,
    grossWpm: 70,
    accuracy: 99,
    errors: 1,
    durationSeconds: 65,
  },
  {
    id: 'demo-s3',
    date: '2026-10-14T11:20:00Z',
    snippetId: 'js-debounce',
    snippetTitle: 'Debounce with Immediate Option',
    language: 'JavaScript',
    difficulty: 'Intermediate',
    wpm: 62,
    grossWpm: 64,
    accuracy: 97,
    errors: 2,
    durationSeconds: 78,
  },
  {
    id: 'demo-s4',
    date: '2026-10-13T09:30:00Z',
    snippetId: 'go-worker-pool',
    snippetTitle: 'Concurrent Worker Pool',
    language: 'Go',
    difficulty: 'Advanced',
    wpm: 56,
    grossWpm: 59,
    accuracy: 95,
    errors: 6,
    durationSeconds: 220,
  },
  {
    id: 'demo-s5',
    date: '2026-10-12T14:15:00Z',
    snippetId: 'ts-event-emitter',
    snippetTitle: 'Typed Event Emitter',
    language: 'TypeScript',
    difficulty: 'Intermediate',
    wpm: 59,
    grossWpm: 61,
    accuracy: 97,
    errors: 4,
    durationSeconds: 215,
  },
  {
    id: 'demo-s6',
    date: '2026-10-11T18:05:00Z',
    snippetId: 'sql-window-func',
    snippetTitle: 'Running Total & Window Functions',
    language: 'SQL',
    difficulty: 'Intermediate',
    wpm: 53,
    grossWpm: 55,
    accuracy: 96,
    errors: 4,
    durationSeconds: 130,
  },
  {
    id: 'demo-s7',
    date: '2026-10-10T12:00:00Z',
    snippetId: 'rust-quicksort',
    snippetTitle: 'In-Place QuickSort',
    language: 'Rust',
    difficulty: 'Advanced',
    wpm: 51,
    grossWpm: 54,
    accuracy: 94,
    errors: 7,
    durationSeconds: 185,
  },
  {
    id: 'demo-s8',
    date: '2026-10-09T17:35:00Z',
    snippetId: 'cpp-binary-search',
    snippetTitle: 'Binary Search Algorithm',
    language: 'C++',
    difficulty: 'Beginner',
    wpm: 62,
    grossWpm: 63,
    accuracy: 98,
    errors: 2,
    durationSeconds: 98,
  },
  {
    id: 'demo-s9',
    date: '2026-10-08T08:50:00Z',
    snippetId: 'py-merge-intervals',
    snippetTitle: 'Merge Overlapping Intervals',
    language: 'Python',
    difficulty: 'Intermediate',
    wpm: 60,
    grossWpm: 62,
    accuracy: 97,
    errors: 3,
    durationSeconds: 110,
  },
  {
    id: 'demo-s10',
    date: '2026-10-06T15:20:00Z',
    snippetId: 'java-fibonacci',
    snippetTitle: 'Memoized Fibonacci Calculation',
    language: 'Java',
    difficulty: 'Beginner',
    wpm: 57,
    grossWpm: 59,
    accuracy: 96,
    errors: 4,
    durationSeconds: 105,
  },
  {
    id: 'demo-s11',
    date: '2026-10-04T19:10:00Z',
    snippetId: 'py-trie',
    snippetTitle: 'Prefix Tree (Trie)',
    language: 'Python',
    difficulty: 'Advanced',
    wpm: 55,
    grossWpm: 58,
    accuracy: 95,
    errors: 5,
    durationSeconds: 190,
  },
  {
    id: 'demo-s12',
    date: '2026-10-02T11:45:00Z',
    snippetId: 'cpp-bfs',
    snippetTitle: 'Breadth-First Search (BFS)',
    language: 'C++',
    difficulty: 'Intermediate',
    wpm: 58,
    grossWpm: 60,
    accuracy: 97,
    errors: 3,
    durationSeconds: 155,
  },
  {
    id: 'demo-s13',
    date: '2026-09-28T14:30:00Z',
    snippetId: 'js-debounce',
    snippetTitle: 'Debounce with Immediate Option',
    language: 'JavaScript',
    difficulty: 'Intermediate',
    wpm: 56,
    grossWpm: 58,
    accuracy: 96,
    errors: 3,
    durationSeconds: 85,
  },
  {
    id: 'demo-s14',
    date: '2026-09-24T16:15:00Z',
    snippetId: 'go-worker-pool',
    snippetTitle: 'Concurrent Worker Pool',
    language: 'Go',
    difficulty: 'Advanced',
    wpm: 52,
    grossWpm: 55,
    accuracy: 94,
    errors: 6,
    durationSeconds: 235,
  },
  {
    id: 'demo-s15',
    date: '2026-09-20T10:00:00Z',
    snippetId: 'cpp-lru-cache',
    snippetTitle: 'LRU Cache Implementation',
    language: 'C++',
    difficulty: 'Intermediate',
    wpm: 54,
    grossWpm: 57,
    accuracy: 95,
    errors: 5,
    durationSeconds: 220,
  },
  {
    id: 'demo-s16',
    date: '2026-09-15T18:40:00Z',
    snippetId: 'py-two-sum',
    snippetTitle: 'Two Sum Hash Map',
    language: 'Python',
    difficulty: 'Beginner',
    wpm: 59,
    grossWpm: 61,
    accuracy: 97,
    errors: 2,
    durationSeconds: 72,
  },
  {
    id: 'demo-s17',
    date: '2026-09-10T12:25:00Z',
    snippetId: 'ts-event-emitter',
    snippetTitle: 'Typed Event Emitter',
    language: 'TypeScript',
    difficulty: 'Intermediate',
    wpm: 53,
    grossWpm: 56,
    accuracy: 95,
    errors: 5,
    durationSeconds: 230,
  },
  {
    id: 'demo-s18',
    date: '2026-09-05T09:15:00Z',
    snippetId: 'sql-window-func',
    snippetTitle: 'Running Total & Window Functions',
    language: 'SQL',
    difficulty: 'Intermediate',
    wpm: 49,
    grossWpm: 52,
    accuracy: 94,
    errors: 5,
    durationSeconds: 145,
  },
  {
    id: 'demo-s19',
    date: '2026-08-28T17:10:00Z',
    snippetId: 'rust-quicksort',
    snippetTitle: 'In-Place QuickSort',
    language: 'Rust',
    difficulty: 'Advanced',
    wpm: 48,
    grossWpm: 51,
    accuracy: 93,
    errors: 8,
    durationSeconds: 205,
  },
  {
    id: 'demo-s20',
    date: '2026-08-20T11:00:00Z',
    snippetId: 'cpp-binary-search',
    snippetTitle: 'Binary Search Algorithm',
    language: 'C++',
    difficulty: 'Beginner',
    wpm: 54,
    grossWpm: 56,
    accuracy: 96,
    errors: 3,
    durationSeconds: 110,
  },
  {
    id: 'demo-s21',
    date: '2026-08-14T15:50:00Z',
    snippetId: 'java-fibonacci',
    snippetTitle: 'Memoized Fibonacci Calculation',
    language: 'Java',
    difficulty: 'Beginner',
    wpm: 50,
    grossWpm: 53,
    accuracy: 95,
    errors: 4,
    durationSeconds: 120,
  },
  {
    id: 'demo-s22',
    date: '2026-08-08T13:20:00Z',
    snippetId: 'py-merge-intervals',
    snippetTitle: 'Merge Overlapping Intervals',
    language: 'Python',
    difficulty: 'Intermediate',
    wpm: 52,
    grossWpm: 55,
    accuracy: 95,
    errors: 4,
    durationSeconds: 125,
  },
  {
    id: 'demo-s23',
    date: '2026-08-01T10:45:00Z',
    snippetId: 'cpp-bfs',
    snippetTitle: 'Breadth-First Search (BFS)',
    language: 'C++',
    difficulty: 'Intermediate',
    wpm: 49,
    grossWpm: 52,
    accuracy: 94,
    errors: 5,
    durationSeconds: 175,
  },
  {
    id: 'demo-s24',
    date: '2026-07-25T16:30:00Z',
    snippetId: 'js-debounce',
    snippetTitle: 'Debounce with Immediate Option',
    language: 'JavaScript',
    difficulty: 'Intermediate',
    wpm: 46,
    grossWpm: 49,
    accuracy: 93,
    errors: 5,
    durationSeconds: 98,
  },
];

/**
 * Load saved real sessions from localStorage, scoped per user ID
 */
export function getSavedSessions(userId) {
  try {
    let raw = null;
    if (userId) {
      raw = localStorage.getItem(`devtype_sessions_${userId}`);
    }
    if (!raw) {
      raw = localStorage.getItem('devtype_sessions');
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse devtype_sessions from localStorage', err);
    return [];
  }
}

/**
 * Save completed session to user-scoped and global localStorage
 */
export function saveUserSession(session, userId) {
  if (!session) return;
  try {
    const userKey = userId ? `devtype_sessions_${userId}` : 'devtype_sessions';
    const existingRaw = localStorage.getItem(userKey);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [session, ...existing.filter((s) => s.id !== session.id)].slice(0, 100);
    localStorage.setItem(userKey, JSON.stringify(updated));

    // Also mirror into global key for quick access
    if (userId) {
      const globalRaw = localStorage.getItem('devtype_sessions');
      const globalExisting = globalRaw ? JSON.parse(globalRaw) : [];
      const globalUpdated = [session, ...globalExisting.filter((s) => s.id !== session.id)].slice(0, 100);
      localStorage.setItem('devtype_sessions', JSON.stringify(globalUpdated));
    }
  } catch (err) {
    console.warn('Failed to save session to localStorage', err);
  }
}

/**
 * Get active sessions based on user preference (strictly authentic, zero mock fallback unless forceDemo requested)
 */
export function getSessions({ userId, forceDemo = false } = {}) {
  if (forceDemo) return DETERMINISTIC_DEMO_SESSIONS;
  return getSavedSessions(userId);
}

/**
 * Filter sessions by date range: '7d', '30d', '90d', 'all'
 * Accurately calculated from the current timestamp.
 */
export function filterSessionsByRange(sessions, range = '30d') {
  if (!sessions || sessions.length === 0) return [];
  if (range === 'all') return [...sessions];

  const now = new Date();
  let cutoffTime;

  if (range === 'today' || range === '24h') {
    // Midnight of the current day
    cutoffTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  } else {
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const cutoffDays = daysMap[range] || 30;
    cutoffTime = Date.now() - cutoffDays * 24 * 60 * 60 * 1000;
  }

  return sessions.filter((s) => {
    const dateVal = s.date || s.completedAt || s.startedAt;
    const sTime = new Date(dateVal).getTime();
    return !isNaN(sTime) && sTime >= cutoffTime;
  });
}

/**
 * Compute summary cards metrics consistently from filtered sessions
 */
export function computeReportMetrics(sessions) {
  if (!sessions || sessions.length === 0) {
    return {
      personalBestWpm: 0,
      averageWpm: 0,
      averageAccuracy: 0,
      totalPracticeSeconds: 0,
      totalPracticeFormatted: '0m',
      completedSessions: 0,
    };
  }

  const wpms = sessions.map((s) => s.wpm || 0);
  const accuracies = sessions.map((s) => s.accuracy || 0);
  const durations = sessions.map((s) => s.durationSeconds || 0);

  const bestWpm = Math.max(...wpms);
  const avgWpm = Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length);
  const avgAcc = Number(
    (accuracies.reduce((a, b) => a + b, 0) / accuracies.length).toFixed(1)
  );
  const totalSeconds = durations.reduce((a, b) => a + b, 0);

  // Format total seconds into hours & minutes
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const formattedDuration =
    hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return {
    personalBestWpm: bestWpm,
    averageWpm: avgWpm,
    averageAccuracy: avgAcc,
    totalPracticeSeconds: totalSeconds,
    totalPracticeFormatted: formattedDuration,
    completedSessions: sessions.length,
  };
}

/**
 * Compute Language Proficiency comparison breakdown
 */
export function computeLanguageProficiency(sessions) {
  if (!sessions || sessions.length === 0) return [];

  const langMap = {};
  sessions.forEach((s) => {
    const lang = s.language || 'Unknown';
    if (!langMap[lang]) {
      langMap[lang] = {
        language: lang,
        count: 0,
        totalWpm: 0,
        totalAccuracy: 0,
        bestWpm: 0,
      };
    }
    langMap[lang].count += 1;
    langMap[lang].totalWpm += s.wpm || 0;
    langMap[lang].totalAccuracy += s.accuracy || 0;
    if ((s.wpm || 0) > langMap[lang].bestWpm) {
      langMap[lang].bestWpm = s.wpm || 0;
    }
  });

  const LANG_PALETTE = {
    'C++': '#2563EB',
    Python: '#4F46E5',
    JavaScript: '#D97706',
    TypeScript: '#0284C7',
    Go: '#0D9488',
    Java: '#EA580C',
    Rust: '#DC2626',
    SQL: '#7C3AED',
  };

  return Object.values(langMap)
    .map((item) => ({
      language: item.language,
      sessions: item.count,
      avgWpm: Math.round(item.totalWpm / item.count),
      avgAccuracy: Number((item.totalAccuracy / item.count).toFixed(1)),
      bestWpm: item.bestWpm,
      color: LANG_PALETTE[item.language] || '#2563EB',
    }))
    .sort((a, b) => b.sessions - a.sessions || b.avgWpm - a.avgWpm);
}

/**
 * Compute Day of Week Practice Distribution
 */
export function computeDayDistribution(sessions) {
  const days = [
    { day: 'Mon', fullName: 'Monday', sessions: 0, minutes: 0 },
    { day: 'Tue', fullName: 'Tuesday', sessions: 0, minutes: 0 },
    { day: 'Wed', fullName: 'Wednesday', sessions: 0, minutes: 0 },
    { day: 'Thu', fullName: 'Thursday', sessions: 0, minutes: 0 },
    { day: 'Fri', fullName: 'Friday', sessions: 0, minutes: 0 },
    { day: 'Sat', fullName: 'Saturday', sessions: 0, minutes: 0 },
    { day: 'Sun', fullName: 'Sunday', sessions: 0, minutes: 0 },
  ];

  if (!sessions || sessions.length === 0) return days;

  sessions.forEach((s) => {
    const d = new Date(s.date);
    if (!isNaN(d.getTime())) {
      // getDay: 0 is Sun, 1 is Mon...
      const dayIdx = (d.getDay() + 6) % 7; // shift so Mon=0, Sun=6
      days[dayIdx].sessions += 1;
      days[dayIdx].minutes += Math.round((s.durationSeconds || 60) / 60);
    }
  });

  return days;
}

/**
 * Compute Progression Timeline for Recharts
 * Sorted chronological (oldest to newest)
 */
export function computeProgressionTimeline(sessions) {
  if (!sessions || sessions.length === 0) return [];

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return sorted.map((s, idx) => {
    const d = new Date(s.date);
    const label = !isNaN(d.getTime())
      ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : `Session ${idx + 1}`;

    return {
      index: idx + 1,
      label,
      fullDate: !isNaN(d.getTime()) ? d.toLocaleDateString('en-US') : '',
      wpm: s.wpm || 0,
      grossWpm: s.grossWpm || s.wpm || 0,
      accuracy: s.accuracy || 0,
      title: s.snippetTitle || s.title || 'Snippet',
      language: s.language || 'Code',
    };
  });
}

/**
 * Export filtered session data to CSV
 */
export function exportSessionsToCsv(sessions, filename = 'codetype-performance-report.csv') {
  if (!sessions || sessions.length === 0) {
    alert('No sessions available to export for the selected date range.');
    return;
  }

  const headers = [
    'Date',
    'Snippet Title',
    'Language',
    'Difficulty',
    'Net WPM',
    'Gross WPM',
    'Accuracy (%)',
    'Duration (s)',
    'Errors',
  ];

  const rows = sessions.map((s) => {
    const d = new Date(s.date);
    const dateStr = !isNaN(d.getTime()) ? d.toISOString() : s.date;
    const titleClean = `"${(s.snippetTitle || s.title || 'Snippet').replace(/"/g, '""')}"`;
    return [
      dateStr,
      titleClean,
      s.language || 'N/A',
      s.difficulty || 'N/A',
      s.wpm ?? 0,
      s.grossWpm ?? s.wpm ?? 0,
      s.accuracy ?? 0,
      s.durationSeconds ?? 0,
      s.errors ?? 0,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
