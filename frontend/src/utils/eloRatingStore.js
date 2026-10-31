// src/utils/eloRatingStore.js

export const ELO_STORAGE_KEY = 'devtype_multiplayer_elo';
export const ELO_EVENT_NAME = 'devtype_elo_updated';
export const BASE_STARTING_RATING = 1200;

export function getEloStorageKey(userId) {
  if (userId) return `${ELO_STORAGE_KEY}_user_${userId}`;
  return `${ELO_STORAGE_KEY}_guest`;
}

/**
 * Fetch user ELO record from localStorage, scoped per user.
 */
export function getUserEloData(userId) {
  try {
    const key = getEloStorageKey(userId);
    const raw = localStorage.getItem(key);
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
 * Synchronize user's ELO data with authoritative database records.
 */
export function syncUserEloFromDatabase(userId, dbRank) {
  if (!dbRank) return getUserEloData(userId);
  const current = getUserEloData(userId);

  const synced = {
    rating: dbRank.rating ?? current.rating,
    peakRating: dbRank.peakRating ?? current.peakRating,
    wins: dbRank.wins ?? current.wins,
    losses: dbRank.losses ?? current.losses,
    matchesPlayed: dbRank.matchesPlayed ?? current.matchesPlayed,
    winStreak: current.winStreak || 0,
    recentDelta: current.recentDelta || 0,
    recentResult: current.recentResult || null,
    history: current.history || [],
  };

  try {
    const key = getEloStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(synced));
    window.dispatchEvent(new CustomEvent(ELO_EVENT_NAME, { detail: synced }));
  } catch (err) {
    console.error('Failed to sync ELO record from DB:', err);
  }

  return synced;
}

/**
 * Record a completed ranked match and update rating.
 */
export const COMPETITIVE_LEADERBOARD_ROSTER = [];

/**
 * BGMI-Style Tier System and Color Tokens
 */
export const BGMI_TIER_ORDER = [
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
  'Crown',
  'Ace',
  'Conqueror',
];

export const BGMI_TIER_CONFIG = {
  Conqueror: { color: '#FBBF24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)', icon: '🏆', badge: 'CONQ' },
  Ace: {
    color: '#F43F5E',
    bg: 'rgba(244, 63, 94, 0.15)',
    border: 'rgba(244, 63, 94, 0.4)',
    icon: '🔥',
    badge: 'ACE',
  },
  Crown: {
    color: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.4)',
    icon: '👑',
    badge: 'CRN',
  },
  Diamond: {
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.4)',
    icon: '💎',
    badge: 'DIA',
  },
  Platinum: {
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.4)',
    icon: '🎖️',
    badge: 'PLT',
  },
  Gold: {
    color: '#EAB308',
    bg: 'rgba(234, 179, 8, 0.15)',
    border: 'rgba(234, 179, 8, 0.4)',
    icon: '🏅',
    badge: 'GLD',
  },
  Silver: {
    color: '#94A3B8',
    bg: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(148, 163, 184, 0.4)',
    icon: '🛡️',
    badge: 'SLV',
  },
  Bronze: {
    color: '#CD7F32',
    bg: 'rgba(205, 127, 50, 0.15)',
    border: 'rgba(205, 127, 50, 0.4)',
    icon: '🥉',
    badge: 'BRZ',
  },
};

/**
 * Exact BGMI Season End Drop Rules matching user provided specifications:
 */
export function getTierGroup(tierName) {
  if (!tierName) return 'Bronze';
  if (tierName === 'Conqueror') return 'Conqueror';
  if (tierName.startsWith('Ace')) return 'Ace';
  if (tierName.startsWith('Crown')) return 'Crown';
  if (tierName.startsWith('Diamond')) return 'Diamond';
  if (tierName.startsWith('Platinum')) return 'Platinum';
  if (tierName.startsWith('Gold')) return 'Gold';
  if (tierName.startsWith('Silver')) return 'Silver';
  return 'Bronze';
}

export function getBgmiTierVisuals(tierName) {
  const group = getTierGroup(tierName);
  return BGMI_TIER_CONFIG[group] || BGMI_TIER_CONFIG.Bronze;
}
