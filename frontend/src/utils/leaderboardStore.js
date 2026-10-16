// src/utils/leaderboardStore.js

/**
 * Deterministic benchmark developer profiles.
 * Explicitly structured as benchmark reference data without randomized or fabricated live server claims.
 */
export const MOCK_DEVELOPERS = [
  {
    id: 'dev-1',
    rank: 1,
    name: 'alex_systems',
    displayName: 'Alex Chen',
    avatar: 'AC',
    avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
    level: 56,
    title: 'Principal Systems Eng',
    primaryLang: 'C++',
    badge: 'Apex Pacesetter',
    tagline: 'Zero-alloc parser run • Custom Corne split keyboard',
    hardware: 'Corne Split 42-key • Lubed Boba U4T',
    streak: 28,
    peakWpm: 136,
    codeSnippet: [
      { ln: 1, parts: [{ k: 't-kw', v: 'template' }, { k: 't-op', v: ' <' }, { k: 't-kw', v: 'typename' }, { k: 't-ty', v: ' T' }, { k: 't-op', v: '>' }] },
      { ln: 2, parts: [{ k: 't-kw', v: 'inline' }, { k: 't-ty', v: ' void' }, { k: 't-va', v: ' fast_zero_tx' }, { k: 't-pu', v: '() noexcept {' }] },
      { ln: 3, parts: [{ k: '', v: '    ' }, { k: 't-va', v: 'ring_buffer' }, { k: 't-op', v: '->' }, { k: 't-va', v: 'dispatch' }, { k: 't-pu', v: '();' }] },
      { ln: 4, parts: [{ k: 't-pu', v: '}' }] },
    ],
    isCurrentUser: false,
    isFriend: false,
    allTime: { wpm: 124, xp: 58400, accuracy: 99.2, sessions: 480 },
    thisMonth: { wpm: 122, xp: 14200, accuracy: 99.1, sessions: 110 },
    thisWeek: { wpm: 120, xp: 3800, accuracy: 99.0, sessions: 32 },
    today: { wpm: 118, xp: 850, accuracy: 99.3, sessions: 8 },
  },
  {
    id: 'dev-2',
    rank: 2,
    name: 'elena_rustacean',
    displayName: 'Elena Rostova',
    avatar: 'ER',
    avatarBg: 'linear-gradient(135deg, #7C2D12, #EA580C)',
    level: 52,
    title: 'Rust Core Maintainer',
    primaryLang: 'Rust',
    badge: 'Concurrency Master',
    tagline: 'Async runtime internals & zero-copy network buffers',
    hardware: 'Keychron Q1 Pro • Gateron Oil Kings',
    streak: 21,
    peakWpm: 129,
    codeSnippet: [
      { ln: 1, parts: [{ k: 't-kw', v: 'pub' }, { k: 't-kw', v: ' async' }, { k: 't-kw', v: ' fn' }, { k: 't-va', v: ' poll_stream' }, { k: 't-pu', v: '() -> ' }, { k: 't-ty', v: 'Poll' }, { k: 't-op', v: '<()>' }] },
      { ln: 2, parts: [{ k: 't-kw', v: 'where' }, { k: 't-ty', v: ' T' }, { k: 't-op', v: ': ' }, { k: 't-ty', v: 'Unpin' }, { k: 't-op', v: ' + ' }, { k: 't-ty', v: 'Send' }, { k: 't-pu', v: ' {' }] },
      { ln: 3, parts: [{ k: '', v: '    ' }, { k: 't-va', v: 'Pin' }, { k: 't-op', v: '::' }, { k: 't-va', v: 'new' }, { k: 't-pu', v: '(&mut self.io).' }, { k: 't-va', v: 'poll_ready' }, { k: 't-pu', v: '(cx)' }] },
      { ln: 4, parts: [{ k: 't-pu', v: '}' }] },
    ],
    isCurrentUser: false,
    isFriend: true,
    allTime: { wpm: 118, xp: 52100, accuracy: 98.9, sessions: 420 },
    thisMonth: { wpm: 116, xp: 12800, accuracy: 98.8, sessions: 98 },
    thisWeek: { wpm: 115, xp: 3400, accuracy: 98.9, sessions: 28 },
    today: { wpm: 114, xp: 720, accuracy: 99.0, sessions: 6 },
  },
  {
    id: 'dev-3',
    rank: 3,
    name: 'marcus_ts',
    displayName: 'Marcus Brody',
    avatar: 'MB',
    avatarBg: 'linear-gradient(135deg, #075985, #0284C7)',
    level: 49,
    title: 'Staff Frontend Architect',
    primaryLang: 'TypeScript',
    badge: 'Syntax Architect',
    tagline: 'Type-level AST computing & canvas virtualizers',
    hardware: 'Mode Sonnet 75% • Alpacas (205g0)',
    streak: 16,
    peakWpm: 122,
    codeSnippet: [
      { ln: 1, parts: [{ k: 't-kw', v: 'export' }, { k: 't-kw', v: ' const' }, { k: 't-va', v: ' compileAST' }, { k: 't-op', v: ' = ' }, { k: 't-pu', v: '<' }, { k: 't-ty', v: 'T' }, { k: 't-pu', v: '>(' }] },
      { ln: 2, parts: [{ k: '', v: '    ' }, { k: 't-va', v: 'source' }, { k: 't-op', v: ': ' }, { k: 't-ty', v: 'string' }, { k: 't-pu', v: '): ' }, { k: 't-ty', v: 'AST' }, { k: 't-op', v: ' => ' }, { k: 't-pu', v: '{' }] },
      { ln: 3, parts: [{ k: '', v: '    ' }, { k: 't-kw', v: 'return' }, { k: 't-va', v: ' tokenize' }, { k: 't-pu', v: '(source).' }, { k: 't-va', v: 'traverse' }, { k: 't-pu', v: '();' }] },
      { ln: 4, parts: [{ k: 't-pu', v: '};' }] },
    ],
    isCurrentUser: false,
    isFriend: false,
    allTime: { wpm: 112, xp: 47900, accuracy: 98.4, sessions: 390 },
    thisMonth: { wpm: 110, xp: 11500, accuracy: 98.2, sessions: 85 },
    thisWeek: { wpm: 108, xp: 2900, accuracy: 98.5, sessions: 24 },
    today: { wpm: 106, xp: 600, accuracy: 98.6, sessions: 5 },
  },
  {
    id: 'dev-4',
    rank: 4,
    name: 'sarah_pythonic',
    displayName: 'Sarah Jenkins',
    avatar: 'SJ',
    avatarBg: 'linear-gradient(135deg, #312E81, #4F46E5)',
    level: 46,
    title: 'ML Platform Lead',
    primaryLang: 'Python',
    badge: 'Tensor Architect',
    tagline: 'Distributed training pipelines & Triton GPU kernels',
    streak: 14,
    peakWpm: 118,
    isCurrentUser: false,
    isFriend: true,
    allTime: { wpm: 108, xp: 43200, accuracy: 98.7, sessions: 350 },
    thisMonth: { wpm: 105, xp: 10200, accuracy: 98.4, sessions: 76 },
    thisWeek: { wpm: 104, xp: 2600, accuracy: 98.5, sessions: 21 },
    today: { wpm: 102, xp: 540, accuracy: 98.8, sessions: 4 },
  },
  {
    id: 'dev-5',
    rank: 5,
    name: 'kenji_go',
    displayName: 'Kenji Takahashi',
    avatar: 'KT',
    avatarBg: 'linear-gradient(135deg, #115E59, #0D9488)',
    level: 44,
    title: 'Distributed Systems Eng',
    primaryLang: 'Go',
    badge: 'Concurrency Ace',
    tagline: 'High-throughput gRPC services & Raft consensus clusters',
    streak: 12,
    peakWpm: 114,
    isCurrentUser: false,
    isFriend: false,
    allTime: { wpm: 104, xp: 39800, accuracy: 98.1, sessions: 310 },
    thisMonth: { wpm: 102, xp: 9400, accuracy: 98.0, sessions: 68 },
    thisWeek: { wpm: 100, xp: 2400, accuracy: 98.2, sessions: 18 },
    today: { wpm: 99, xp: 480, accuracy: 98.4, sessions: 4 },
  },
  {
    id: 'dev-6',
    rank: 6,
    name: 'anika_data',
    displayName: 'Anika Sharma',
    avatar: 'AS',
    avatarBg: 'linear-gradient(135deg, #581C87, #7C3AED)',
    level: 41,
    title: 'Data Platform Architect',
    primaryLang: 'SQL',
    badge: 'Query Optimizer',
    tagline: 'Analytical columnar storage engines & DuckDB pipelines',
    streak: 10,
    peakWpm: 108,
    isCurrentUser: false,
    isFriend: true,
    allTime: { wpm: 98, xp: 36400, accuracy: 97.8, sessions: 290 },
    thisMonth: { wpm: 96, xp: 8700, accuracy: 97.6, sessions: 62 },
    thisWeek: { wpm: 95, xp: 2100, accuracy: 97.9, sessions: 16 },
    today: { wpm: 94, xp: 420, accuracy: 98.1, sessions: 3 },
  },
  {
    id: 'dev-7',
    rank: 7,
    name: 'dev_current_user',
    displayName: 'Developer',
    avatar: 'YOU',
    avatarBg: 'linear-gradient(135deg, #065F46, #10B981)',
    level: 32,
    title: 'Fullstack Developer',
    primaryLang: 'C++',
    badge: 'Rising Star',
    tagline: 'Writing high-performance clean code on CodeType',
    streak: 9,
    peakWpm: 76,
    isCurrentUser: true, // HIGHLIGHTED AS CURRENT USER
    isFriend: true,
    allTime: { wpm: 68, xp: 18450, accuracy: 96.8, sessions: 142 },
    thisMonth: { wpm: 66, xp: 4900, accuracy: 96.5, sessions: 38 },
    thisWeek: { wpm: 65, xp: 1450, accuracy: 96.9, sessions: 12 },
    today: { wpm: 64, xp: 380, accuracy: 97.2, sessions: 3 },
  },
  {
    id: 'dev-8',
    rank: 8,
    name: 'david_java',
    displayName: 'David Vance',
    avatar: 'DV',
    avatarBg: '#DC2626',
    level: 38,
    title: 'Enterprise Backend Eng',
    primaryLang: 'Java',
    isCurrentUser: false,
    isFriend: false,
    allTime: { wpm: 94, xp: 33200, accuracy: 97.5, sessions: 260 },
    thisMonth: { wpm: 92, xp: 7900, accuracy: 97.2, sessions: 55 },
    thisWeek: { wpm: 90, xp: 1900, accuracy: 97.4, sessions: 14 },
    today: { wpm: 88, xp: 360, accuracy: 97.6, sessions: 3 },
  },
  {
    id: 'dev-9',
    rank: 9,
    name: 'sophie_frontend',
    displayName: 'Sophie Taylor',
    avatar: 'ST',
    avatarBg: '#D97706',
    level: 36,
    title: 'Design Systems Lead',
    primaryLang: 'JavaScript',
    isCurrentUser: false,
    isFriend: false,
    allTime: { wpm: 91, xp: 30100, accuracy: 97.2, sessions: 235 },
    thisMonth: { wpm: 89, xp: 7200, accuracy: 97.0, sessions: 49 },
    thisWeek: { wpm: 88, xp: 1750, accuracy: 97.3, sessions: 12 },
    today: { wpm: 86, xp: 310, accuracy: 97.5, sessions: 2 },
  },
  {
    id: 'dev-10',
    rank: 10,
    name: 'liam_backend',
    displayName: 'Liam O’Connor',
    avatar: 'LO',
    avatarBg: '#059669',
    level: 34,
    title: 'Cloud Infrastructure Eng',
    primaryLang: 'Go',
    isCurrentUser: false,
    isFriend: true,
    allTime: { wpm: 88, xp: 27500, accuracy: 96.9, sessions: 215 },
    thisMonth: { wpm: 86, xp: 6500, accuracy: 96.6, sessions: 44 },
    thisWeek: { wpm: 85, xp: 1550, accuracy: 96.8, sessions: 11 },
    today: { wpm: 83, xp: 280, accuracy: 97.1, sessions: 2 },
  },
  {
    id: 'dev-11',
    rank: 11,
    name: 'mateo_algorithms',
    displayName: 'Mateo Rossi',
    avatar: 'MR',
    avatarBg: '#2563EB',
    level: 33,
    title: 'Competitive Programmer',
    primaryLang: 'C++',
    isCurrentUser: false,
    isFriend: false,
    allTime: { wpm: 86, xp: 25200, accuracy: 96.5, sessions: 195 },
    thisMonth: { wpm: 84, xp: 5900, accuracy: 96.3, sessions: 39 },
    thisWeek: { wpm: 82, xp: 1400, accuracy: 96.6, sessions: 9 },
    today: { wpm: 80, xp: 240, accuracy: 96.8, sessions: 2 },
  },
  {
    id: 'dev-12',
    rank: 12,
    name: 'clara_ml',
    displayName: 'Clara Dubois',
    avatar: 'CD',
    avatarBg: '#4F46E5',
    level: 30,
    title: 'Computer Vision Eng',
    primaryLang: 'Python',
    isCurrentUser: false,
    isFriend: false,
    allTime: { wpm: 83, xp: 22800, accuracy: 96.2, sessions: 175 },
    thisMonth: { wpm: 81, xp: 5200, accuracy: 96.0, sessions: 34 },
    thisWeek: { wpm: 79, xp: 1250, accuracy: 96.3, sessions: 8 },
    today: { wpm: 77, xp: 210, accuracy: 96.5, sessions: 2 },
  },
  {
    id: 'dev-13',
    rank: 13,
    name: 'johan_systems',
    displayName: 'Johan Lindberg',
    avatar: 'JL',
    avatarBg: '#EA580C',
    level: 28,
    title: 'Low-Level Kernel Eng',
    primaryLang: 'Rust',
    isCurrentUser: false,
    isFriend: false,
    allTime: { wpm: 80, xp: 20400, accuracy: 95.9, sessions: 155 },
    thisMonth: { wpm: 78, xp: 4600, accuracy: 95.7, sessions: 30 },
    thisWeek: { wpm: 76, xp: 1100, accuracy: 96.0, sessions: 7 },
    today: { wpm: 74, xp: 180, accuracy: 96.2, sessions: 1 },
  },
  {
    id: 'dev-14',
    rank: 14,
    name: 'priya_fullstack',
    displayName: 'Priya Patel',
    avatar: 'PP',
    avatarBg: '#0284C7',
    level: 26,
    title: 'Web Application Eng',
    primaryLang: 'TypeScript',
    isCurrentUser: false,
    isFriend: false,
    allTime: { wpm: 77, xp: 18100, accuracy: 95.5, sessions: 138 },
    thisMonth: { wpm: 75, xp: 4100, accuracy: 95.3, sessions: 26 },
    thisWeek: { wpm: 73, xp: 950, accuracy: 95.6, sessions: 6 },
    today: { wpm: 71, xp: 160, accuracy: 95.8, sessions: 1 },
  },
  {
    id: 'dev-15',
    rank: 15,
    name: 'tariq_sql',
    displayName: 'Tariq Mansoor',
    avatar: 'TM',
    avatarBg: '#7C3AED',
    level: 24,
    title: 'Database Administrator',
    primaryLang: 'SQL',
    isCurrentUser: false,
    isFriend: false,
    allTime: { wpm: 74, xp: 16200, accuracy: 95.1, sessions: 120 },
    thisMonth: { wpm: 72, xp: 3600, accuracy: 94.9, sessions: 22 },
    thisWeek: { wpm: 70, xp: 820, accuracy: 95.2, sessions: 5 },
    today: { wpm: 68, xp: 140, accuracy: 95.4, sessions: 1 },
  },
];

/**
 * Filter, sort, and rank developers based on active controls
 */
export function filterLeaderboard({
  scope = 'global', // 'global' | 'friends'
  metric = 'wpm', // 'wpm' | 'xp'
  timeframe = 'allTime', // 'allTime' | 'today' | 'thisWeek' | 'thisMonth'
  searchQuery = '',
}) {
  let list = [...MOCK_DEVELOPERS];

  // Scope filter
  if (scope === 'friends') {
    list = list.filter((dev) => dev.isFriend || dev.isCurrentUser);
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(
      (dev) =>
        dev.name.toLowerCase().includes(q) ||
        dev.displayName.toLowerCase().includes(q) ||
        (dev.title && dev.title.toLowerCase().includes(q)) ||
        (dev.badge && dev.badge.toLowerCase().includes(q)) ||
        dev.primaryLang.toLowerCase().includes(q)
    );
  }

  // Extract metric for active timeframe
  const timeframeKey =
    timeframe === 'today'
      ? 'today'
      : timeframe === 'thisWeek'
      ? 'thisWeek'
      : timeframe === 'thisMonth'
      ? 'thisMonth'
      : 'allTime';

  const mapped = list.map((dev) => {
    const stats = dev[timeframeKey] || dev.allTime;
    return {
      id: dev.id,
      name: dev.name,
      displayName: dev.displayName,
      avatar: dev.avatar,
      avatarBg: dev.avatarBg,
      level: dev.level,
      title: dev.title,
      primaryLang: dev.primaryLang,
      badge: dev.badge || 'Competitor',
      tagline: dev.tagline || 'Engineering benchmark runner',
      hardware: dev.hardware || 'Custom Mechanical 65% • Lubed Linears',
      codeSnippet: dev.codeSnippet || null,
      streak: dev.streak || 5,
      peakWpm: dev.peakWpm || stats.wpm + 10,
      isCurrentUser: dev.isCurrentUser,
      isFriend: dev.isFriend,
      wpm: stats.wpm,
      xp: stats.xp,
      accuracy: stats.accuracy,
      sessions: stats.sessions,
    };
  });

  // Sort by active metric descending
  mapped.sort((a, b) => {
    if (metric === 'xp') {
      return b.xp - a.xp || b.wpm - a.wpm;
    }
    return b.wpm - a.wpm || b.accuracy - a.accuracy;
  });

  // Assign updated dynamic ranking index
  return mapped.map((dev, idx) => ({
    ...dev,
    rank: idx + 1,
  }));
}
