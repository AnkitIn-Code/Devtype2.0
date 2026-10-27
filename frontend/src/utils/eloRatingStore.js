// src/utils/eloRatingStore.js

export const ELO_STORAGE_KEY = 'devtype_multiplayer_elo';
export const ELO_EVENT_NAME = 'devtype_elo_updated';
export const BASE_STARTING_RATING = 1200;

export const RANK_TIERS = [
  { name: 'Grandmaster', minElo: 2400, badge: 'GM', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)', icon: '👑' },
  { name: 'Master',      minElo: 2000, badge: 'M',  color: '#E11D48', bg: 'rgba(225, 29, 72, 0.15)',  border: 'rgba(225, 29, 72, 0.35)',  icon: '⚔️' },
  { name: 'Diamond',     minElo: 1800, badge: 'D',  color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)',  border: 'rgba(6, 182, 212, 0.35)',  icon: '💎' },
  { name: 'Gold',        minElo: 1500, badge: 'G',  color: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)',  border: 'rgba(234, 179, 8, 0.35)',  icon: '🏅' },
  { name: 'Silver',      minElo: 1200, badge: 'S',  color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.35)', icon: '🛡️' },
  { name: 'Bronze',      minElo: 0,    badge: 'B',  color: '#CD7F32', bg: 'rgba(205, 127, 50, 0.15)', border: 'rgba(205, 127, 50, 0.35)', icon: '🥉' },
];

export function getTierForRating(rating) {
  const r = Number(rating) || BASE_STARTING_RATING;
  for (const tier of RANK_TIERS) {
    if (r >= tier.minElo) return tier;
  }
  return RANK_TIERS[RANK_TIERS.length - 1];
}

/**
 * Standard Chess ELO calculation.
 * @param {number} playerRating Current player ELO
 * @param {number} opponentRating Opponent ELO
 * @param {boolean} isWin Whether player won
 * @param {number} kFactor K-value weight (default 32)
 */
export function calculateEloDelta(playerRating, opponentRating = 1200, isWin = true, kFactor = 32) {
  const pRating = Number(playerRating) || BASE_STARTING_RATING;
  const oRating = Number(opponentRating) || BASE_STARTING_RATING;

  // Expected probability of player winning
  const expected = 1 / (1 + Math.pow(10, (oRating - pRating) / 400));
  const actual = isWin ? 1 : 0;
  let delta = Math.round(kFactor * (actual - expected));

  // Minimum guarantees
  if (isWin && delta < 8) delta = 8;
  if (!isWin && delta > -6) delta = -6;

  return delta;
}

/**
 * Fetch user ELO record from localStorage.
 */
export function getUserEloData() {
  try {
    const raw = localStorage.getItem(ELO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.rating === 'number') {
        return {
          rating: parsed.rating,
          peakRating: parsed.peakRating || parsed.rating,
          wins: parsed.wins || 0,
          losses: parsed.losses || 0,
          matchesPlayed: parsed.matchesPlayed || (parsed.wins || 0) + (parsed.losses || 0),
          winStreak: parsed.winStreak || 0,
          recentDelta: parsed.recentDelta || 0,
          recentResult: parsed.recentResult || null,
          history: Array.isArray(parsed.history) ? parsed.history : [],
        };
      }
    }
  } catch (err) {
    console.warn('Failed to parse user ELO data:', err);
  }

  return {
    rating: BASE_STARTING_RATING,
    peakRating: BASE_STARTING_RATING,
    wins: 0,
    losses: 0,
    matchesPlayed: 0,
    winStreak: 0,
    recentDelta: 0,
    recentResult: null,
    history: [],
  };
}

/**
 * Record a completed ranked match and update rating.
 */
export function recordRankedMatch({
  isWin,
  mode = '1v1 Battle',
  opponentName = 'Competitor',
  opponentRating = 1220,
  userWpm = 85,
  userAccuracy = 98,
}) {
  const current = getUserEloData();
  const delta = calculateEloDelta(current.rating, opponentRating, isWin);
  const newRating = Math.max(300, current.rating + delta);
  const newPeak = Math.max(current.peakRating, newRating);
  const newWins = isWin ? current.wins + 1 : current.wins;
  const newLosses = !isWin ? current.losses + 1 : current.losses;
  const newStreak = isWin ? current.winStreak + 1 : 0;

  const matchRecord = {
    id: `match-${Date.now()}`,
    timestamp: new Date().toISOString(),
    mode,
    opponentName,
    opponentRating,
    isWin,
    delta,
    newRating,
    userWpm,
    userAccuracy,
  };

  const updatedData = {
    rating: newRating,
    peakRating: newPeak,
    wins: newWins,
    losses: newLosses,
    matchesPlayed: current.matchesPlayed + 1,
    winStreak: newStreak,
    recentDelta: delta,
    recentResult: isWin ? 'WIN' : 'LOSS',
    history: [matchRecord, ...current.history].slice(0, 30),
  };

  try {
    localStorage.setItem(ELO_STORAGE_KEY, JSON.stringify(updatedData));
    window.dispatchEvent(new CustomEvent(ELO_EVENT_NAME, { detail: updatedData }));
  } catch (err) {
    console.error('Failed to save ELO record:', err);
  }

  return {
    ...updatedData,
    delta,
    oldRating: current.rating,
  };
}

/**
 * Authoritative pool of competitive multiplayer rivals for the ELO Chess-Style Leaderboard.
 */
export const COMPETITIVE_LEADERBOARD_ROSTER = [
  {
    id: 'gm-neo-coder',
    name: 'neo_matrix',
    displayName: 'NeoCoder_GM',
    avatar: 'NC',
    avatarBg: 'linear-gradient(135deg, #F59E0B, #B45309)',
    rating: 2684,
    peakRating: 2712,
    wins: 342,
    losses: 48,
    recentDelta: 24,
    favLang: 'C++',
    status: 'In Ranked Queue',
    title: 'Grandmaster · Season 1 Champion',
  },
  {
    id: 'gm-magnus-type',
    name: 'magnus_keystroke',
    displayName: 'MagnusKey',
    avatar: 'MK',
    avatarBg: 'linear-gradient(135deg, #10B981, #047857)',
    rating: 2610,
    peakRating: 2635,
    wins: 298,
    losses: 41,
    recentDelta: 18,
    favLang: 'Rust',
    status: 'Online',
    title: 'Grandmaster · Precision Specialist',
  },
  {
    id: 'gm-sarah-ts',
    name: 'sarah_ts',
    displayName: 'SarahDev.ts',
    avatar: 'ST',
    avatarBg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    rating: 2542,
    peakRating: 2580,
    wins: 275,
    losses: 54,
    recentDelta: -14,
    favLang: 'TypeScript',
    status: 'Online',
    title: 'Grandmaster · Async Duelist',
  },
  {
    id: 'm-alex-sys',
    name: 'alex_systems',
    displayName: 'Alex_Systems',
    avatar: 'AS',
    avatarBg: 'linear-gradient(135deg, #E11D48, #9F1239)',
    rating: 2380,
    peakRating: 2410,
    wins: 210,
    losses: 62,
    recentDelta: 22,
    favLang: 'C++',
    status: 'Practicing',
    title: 'Master · Kernel Sprinter',
  },
  {
    id: 'm-elena-rust',
    name: 'elena_rust',
    displayName: 'Elena_Rustacean',
    avatar: 'ER',
    avatarBg: 'linear-gradient(135deg, #EA580C, #9A3412)',
    rating: 2295,
    peakRating: 2320,
    wins: 194,
    losses: 59,
    recentDelta: 16,
    favLang: 'Rust',
    status: 'In 1v1 Battle',
    title: 'Master · Zero-Cost Typist',
  },
  {
    id: 'm-kenji-go',
    name: 'kenji_goroutine',
    displayName: 'Kenji_Go',
    avatar: 'KG',
    avatarBg: 'linear-gradient(135deg, #06B6D4, #0E7490)',
    rating: 2180,
    peakRating: 2215,
    wins: 182,
    losses: 68,
    recentDelta: -18,
    favLang: 'Go',
    status: 'Online',
    title: 'Master · Concurrent Sprint',
  },
  {
    id: 'm-vikram-py',
    name: 'vikram_algo',
    displayName: 'Vikram_Py',
    avatar: 'VP',
    avatarBg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    rating: 2045,
    peakRating: 2090,
    wins: 165,
    losses: 74,
    recentDelta: 12,
    favLang: 'Python',
    status: 'Offline',
    title: 'Master · Dynamic Programmer',
  },
  {
    id: 'd-marcus-cpp',
    name: 'marcus_lowlevel',
    displayName: 'Marcus_LowLevel',
    avatar: 'ML',
    avatarBg: 'linear-gradient(135deg, #0284C7, #0369A1)',
    rating: 1950,
    peakRating: 1980,
    wins: 142,
    losses: 65,
    recentDelta: 26,
    favLang: 'C',
    status: 'In Classic Race',
    title: 'Diamond · Memory Optimizer',
  },
  {
    id: 'd-chloe-react',
    name: 'chloe_frontend',
    displayName: 'Chloe_UI',
    avatar: 'CU',
    avatarBg: 'linear-gradient(135deg, #EC4899, #BE185D)',
    rating: 1880,
    peakRating: 1910,
    wins: 130,
    losses: 70,
    recentDelta: -12,
    favLang: 'JavaScript',
    status: 'Online',
    title: 'Diamond · Component Sprinter',
  },
  {
    id: 'd-hassan-sql',
    name: 'hassan_db',
    displayName: 'Hassan_SQL',
    avatar: 'HS',
    avatarBg: 'linear-gradient(135deg, #6366F1, #4338CA)',
    rating: 1815,
    peakRating: 1840,
    wins: 122,
    losses: 68,
    recentDelta: 14,
    favLang: 'SQL',
    status: 'Online',
    title: 'Diamond · Query Executioner',
  },
  {
    id: 'g-dev-rachel',
    name: 'rachel_code',
    displayName: 'RachelCodes',
    avatar: 'RC',
    avatarBg: 'linear-gradient(135deg, #EAB308, #A16207)',
    rating: 1720,
    peakRating: 1750,
    wins: 98,
    losses: 62,
    recentDelta: 20,
    favLang: 'Python',
    status: 'Online',
    title: 'Gold · Fast Prototyper',
  },
  {
    id: 'g-dev-liam',
    name: 'liam_dev',
    displayName: 'Liam_Kbd',
    avatar: 'LK',
    avatarBg: 'linear-gradient(135deg, #14B8A6, #0F766E)',
    rating: 1640,
    peakRating: 1675,
    wins: 88,
    losses: 59,
    recentDelta: -16,
    favLang: 'TypeScript',
    status: 'Offline',
    title: 'Gold · Fullstack Racer',
  },
  {
    id: 'g-dev-zane',
    name: 'zane_java',
    displayName: 'Zane_JVM',
    avatar: 'ZJ',
    avatarBg: 'linear-gradient(135deg, #F97316, #C2410C)',
    rating: 1530,
    peakRating: 1560,
    wins: 76,
    losses: 60,
    recentDelta: 18,
    favLang: 'Java',
    status: 'Online',
    title: 'Gold · Enterprise Typist',
  },
  {
    id: 's-dev-priya',
    name: 'priya_dev',
    displayName: 'Priya_Algorithms',
    avatar: 'PA',
    avatarBg: 'linear-gradient(135deg, #64748B, #334155)',
    rating: 1440,
    peakRating: 1470,
    wins: 62,
    losses: 55,
    recentDelta: 14,
    favLang: 'C++',
    status: 'Online',
    title: 'Silver · Graph Explorer',
  },
  {
    id: 's-dev-tomas',
    name: 'tomas_code',
    displayName: 'Tomas_Dev',
    avatar: 'TD',
    avatarBg: 'linear-gradient(135deg, #64748B, #334155)',
    rating: 1360,
    peakRating: 1390,
    wins: 54,
    losses: 52,
    recentDelta: -14,
    favLang: 'JavaScript',
    status: 'In Ranked Queue',
    title: 'Silver · Web Developer',
  },
  {
    id: 's-dev-maya',
    name: 'maya_tech',
    displayName: 'Maya_Cloud',
    avatar: 'MC',
    avatarBg: 'linear-gradient(135deg, #64748B, #334155)',
    rating: 1250,
    peakRating: 1280,
    wins: 45,
    losses: 48,
    recentDelta: 10,
    favLang: 'Go',
    status: 'Online',
    title: 'Silver · Microservices Typist',
  },
  {
    id: 'b-dev-jordan',
    name: 'jordan_starter',
    displayName: 'Jordan_Types',
    avatar: 'JT',
    avatarBg: 'linear-gradient(135deg, #78350F, #451A03)',
    rating: 1140,
    peakRating: 1180,
    wins: 28,
    losses: 42,
    recentDelta: -12,
    favLang: 'Python',
    status: 'Online',
    title: 'Bronze · Rising Typist',
  },
  {
    id: 'b-dev-sam',
    name: 'sam_learning',
    displayName: 'Sam_Novice',
    avatar: 'SN',
    avatarBg: 'linear-gradient(135deg, #78350F, #451A03)',
    rating: 1080,
    peakRating: 1120,
    wins: 19,
    losses: 38,
    recentDelta: 8,
    favLang: 'JavaScript',
    status: 'Offline',
    title: 'Bronze · Apprentice',
  },
];
