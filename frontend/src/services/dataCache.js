// src/services/dataCache.js
import { dashboardService } from './dashboardService';
import { practiceService } from './practiceService';
import { templateService } from './templateService';
import { srsService } from './srsService';
import { achievementService } from './achievementService';
import { leaderboardService } from './leaderboardService';
import { apiFetch } from './api';

const MEM_CACHE = {
  dashboard: new Map(),
  sessions: new Map(),
  templates: null,
  srsDue: new Map(),
  srsDeck: new Map(),
  achievements: new Map(),
  leaderboard: new Map(),
  seasonInfo: null,
  myRank: new Map(),
  tierConfig: null,
};

function safeStorageGet(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeStorageSet(key, val) {
  try {
    if (val !== undefined && val !== null) {
      sessionStorage.setItem(key, JSON.stringify(val));
    } else {
      sessionStorage.removeItem(key);
    }
  } catch {}
}

export const dataCache = {
  // ── Dashboard Summary ──
  getDashboard(userId) {
    const uid = userId || 'anon';
    if (MEM_CACHE.dashboard.has(uid)) {
      return MEM_CACHE.dashboard.get(uid);
    }
    const fromStorage = safeStorageGet(`devtype_cache_dash_${uid}`);
    if (fromStorage) {
      MEM_CACHE.dashboard.set(uid, fromStorage);
      return fromStorage;
    }
    return null;
  },

  setDashboard(userId, data) {
    const uid = userId || 'anon';
    if (data) {
      MEM_CACHE.dashboard.set(uid, data);
      safeStorageSet(`devtype_cache_dash_${uid}`, data);
    }
  },

  // ── Sessions ──
  getSessions(userId) {
    const uid = userId || 'anon';
    if (MEM_CACHE.sessions.has(uid)) {
      return MEM_CACHE.sessions.get(uid);
    }
    const fromStorage = safeStorageGet(`devtype_cache_sess_${uid}`);
    if (fromStorage) {
      MEM_CACHE.sessions.set(uid, fromStorage);
      return fromStorage;
    }
    return null;
  },

  setSessions(userId, sessions) {
    const uid = userId || 'anon';
    if (sessions) {
      MEM_CACHE.sessions.set(uid, sessions);
      safeStorageSet(`devtype_cache_sess_${uid}`, sessions);
    }
  },

  // ── Templates ──
  getTemplates() {
    if (MEM_CACHE.templates) {
      return MEM_CACHE.templates;
    }
    const fromStorage = safeStorageGet('devtype_cache_templates');
    if (fromStorage) {
      MEM_CACHE.templates = fromStorage;
      return fromStorage;
    }
    return null;
  },

  setTemplates(templates) {
    if (templates) {
      MEM_CACHE.templates = templates;
      safeStorageSet('devtype_cache_templates', templates);
    }
  },

  // ── SRS Cards ──
  getDueCards(userId) {
    const uid = userId || 'anon';
    if (MEM_CACHE.srsDue.has(uid)) return MEM_CACHE.srsDue.get(uid);
    const stored = safeStorageGet(`devtype_cache_srsdue_${uid}`);
    if (stored) {
      MEM_CACHE.srsDue.set(uid, stored);
      return stored;
    }
    return null;
  },

  setDueCards(userId, cards) {
    const uid = userId || 'anon';
    if (cards) {
      MEM_CACHE.srsDue.set(uid, cards);
      safeStorageSet(`devtype_cache_srsdue_${uid}`, cards);
    }
  },

  getDeck(userId) {
    const uid = userId || 'anon';
    if (MEM_CACHE.srsDeck.has(uid)) return MEM_CACHE.srsDeck.get(uid);
    const stored = safeStorageGet(`devtype_cache_srsdeck_${uid}`);
    if (stored) {
      MEM_CACHE.srsDeck.set(uid, stored);
      return stored;
    }
    return null;
  },

  setDeck(userId, deck) {
    const uid = userId || 'anon';
    if (deck) {
      MEM_CACHE.srsDeck.set(uid, deck);
      safeStorageSet(`devtype_cache_srsdeck_${uid}`, deck);
    }
  },

  // ── Achievements ──
  getAchievements(userId) {
    const uid = userId || 'anon';
    if (MEM_CACHE.achievements.has(uid)) return MEM_CACHE.achievements.get(uid);
    const stored = safeStorageGet(`devtype_cache_ach_${uid}`);
    if (stored) {
      MEM_CACHE.achievements.set(uid, stored);
      return stored;
    }
    return null;
  },

  setAchievements(userId, badges) {
    const uid = userId || 'anon';
    if (badges) {
      MEM_CACHE.achievements.set(uid, badges);
      safeStorageSet(`devtype_cache_ach_${uid}`, badges);
    }
  },

  // ── Leaderboard Rankings ──
  getLeaderboard(tier = 'all') {
    const key = tier || 'all';
    if (MEM_CACHE.leaderboard.has(key)) return MEM_CACHE.leaderboard.get(key);
    const stored = safeStorageGet(`devtype_cache_lb_${key}`);
    if (stored) {
      MEM_CACHE.leaderboard.set(key, stored);
      return stored;
    }
    return null;
  },

  setLeaderboard(tier = 'all', list) {
    const key = tier || 'all';
    if (list) {
      MEM_CACHE.leaderboard.set(key, list);
      safeStorageSet(`devtype_cache_lb_${key}`, list);
    }
  },

  // ── Season Info ──
  getSeasonInfo() {
    if (MEM_CACHE.seasonInfo) return MEM_CACHE.seasonInfo;
    const stored = safeStorageGet('devtype_cache_season_info');
    if (stored) {
      MEM_CACHE.seasonInfo = stored;
      return stored;
    }
    return null;
  },

  setSeasonInfo(info) {
    if (info) {
      MEM_CACHE.seasonInfo = info;
      safeStorageSet('devtype_cache_season_info', info);
    }
  },

  // ── My Rank ──
  getMyRank(userId) {
    const uid = userId || 'anon';
    if (MEM_CACHE.myRank.has(uid)) return MEM_CACHE.myRank.get(uid);
    const stored = safeStorageGet(`devtype_cache_myrank_${uid}`);
    if (stored) {
      MEM_CACHE.myRank.set(uid, stored);
      return stored;
    }
    return null;
  },

  setMyRank(userId, rank) {
    const uid = userId || 'anon';
    if (rank) {
      MEM_CACHE.myRank.set(uid, rank);
      safeStorageSet(`devtype_cache_myrank_${uid}`, rank);
    }
  },

  // ── Tier Configuration ──
  getTierConfig() {
    if (MEM_CACHE.tierConfig) return MEM_CACHE.tierConfig;
    const stored = safeStorageGet('devtype_cache_tier_config');
    if (stored) {
      MEM_CACHE.tierConfig = stored;
      return stored;
    }
    return null;
  },

  setTierConfig(config) {
    if (config) {
      MEM_CACHE.tierConfig = config;
      safeStorageSet('devtype_cache_tier_config', config);
    }
  },

  // ── Eager Background Prefetch Engine ──
  async prefetchAll(userId) {
    if (!userId) return;

    const pDash = dashboardService
      .getDashboardSummary()
      .then((data) => {
        if (data) {
          this.setDashboard(userId, data);
        }
        return data;
      })
      .catch(() => null);

    const pSess = practiceService
      .getUserSessions({ page: 0, size: 50, sort: 'completedAt,desc' })
      .then((res) => {
        const items = res?.items || [];
        if (items.length > 0) {
          this.setSessions(userId, items);
        }
        return items;
      })
      .catch(() => null);

    const pTemplates = templateService
      .getTemplates({ size: 100, sort: 'id,asc' })
      .then((res) => {
        const items = res?.items || res?.content || [];
        if (items.length > 0) {
          this.setTemplates(items);
        }
        return items;
      })
      .catch(() => null);

    const pSrsDue = srsService
      .getDueCards()
      .then((cards) => {
        if (Array.isArray(cards)) {
          this.setDueCards(userId, cards);
        }
        return cards;
      })
      .catch(() => null);

    const pSrsDeck = srsService
      .getDeck()
      .then((deck) => {
        if (Array.isArray(deck)) {
          this.setDeck(userId, deck);
        }
        return deck;
      })
      .catch(() => null);

    const pAch = achievementService
      .getAchievements()
      .then((badges) => {
        if (Array.isArray(badges)) {
          this.setAchievements(userId, badges);
        }
        return badges;
      })
      .catch(() => null);

    const pLeaderboard = leaderboardService
      .getLeaderboard('all')
      .then((lb) => {
        if (Array.isArray(lb) && lb.length > 0) {
          this.setLeaderboard('all', lb);
        }
        return lb;
      })
      .catch(() => null);

    const pSeason = leaderboardService
      .getSeasonInfo()
      .then((info) => {
        if (info) {
          this.setSeasonInfo(info);
        }
        return info;
      })
      .catch(() => null);

    const pMyRank = leaderboardService
      .getMyRank()
      .then((myRank) => {
        if (myRank) {
          this.setMyRank(userId, myRank);
        }
        return myRank;
      })
      .catch(() => null);

    const pTiers = apiFetch('/api/v1/leaderboard/tiers')
      .then((tiers) => {
        if (tiers) {
          this.setTierConfig(tiers);
        }
        return tiers;
      })
      .catch(() => null);

    await Promise.allSettled([
      pDash,
      pSess,
      pTemplates,
      pSrsDue,
      pSrsDeck,
      pAch,
      pLeaderboard,
      pSeason,
      pMyRank,
      pTiers,
    ]);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('devtype_cache_revalidated', { detail: { userId } }));
    }
  },

  clearUserCache(userId) {
    const uid = userId || 'anon';
    MEM_CACHE.dashboard.delete(uid);
    MEM_CACHE.sessions.delete(uid);
    MEM_CACHE.srsDue.delete(uid);
    MEM_CACHE.srsDeck.delete(uid);
    MEM_CACHE.achievements.delete(uid);
    MEM_CACHE.leaderboard.clear();
    MEM_CACHE.myRank.delete(uid);
    try {
      sessionStorage.removeItem(`devtype_cache_dash_${uid}`);
      sessionStorage.removeItem(`devtype_cache_sess_${uid}`);
      sessionStorage.removeItem(`devtype_cache_srsdue_${uid}`);
      sessionStorage.removeItem(`devtype_cache_srsdeck_${uid}`);
      sessionStorage.removeItem(`devtype_cache_ach_${uid}`);
      sessionStorage.removeItem(`devtype_cache_lb_all`);
      sessionStorage.removeItem(`devtype_cache_season_info`);
      sessionStorage.removeItem(`devtype_cache_myrank_${uid}`);
      sessionStorage.removeItem(`devtype_cache_tier_config`);
    } catch {}
  },
};
