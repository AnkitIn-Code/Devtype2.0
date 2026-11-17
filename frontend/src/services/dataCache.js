// src/services/dataCache.js
import { dashboardService } from './dashboardService.js';
import { practiceService } from './practiceService.js';
import { templateService } from './templateService.js';
import { srsService } from './srsService.js';
import { achievementService } from './achievementService.js';
import { leaderboardService } from './leaderboardService.js';
import { apiFetch } from './api.js';

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
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeStorageSet(key, val) {
  try {
    if (val !== undefined && val !== null) {
      const serialized = JSON.stringify(val);
      sessionStorage.setItem(key, serialized);
      localStorage.setItem(key, serialized);
    } else {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
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
      if (Array.isArray(stored)) {
        const mockIds = new Set(['cpp-fast-io', 'cp-min-stack', 'merge-sort', 'binary-search-cpp', 'cp-fenwick-tree', 'lru-cache-cpp', 'two-sum-cpp', 'react-use-effect']);
        const mockTitles = new Set([
          'Fast Competitive I/O & Stream Synchronization',
          'Stack Modification: Minimum Stack in O(1)',
          'Merge Sort: Divide & Conquer Recursion',
          'Binary Search Algorithm',
          'Fenwick Tree: Point Updates & Range Sums',
          'LRU Cache: Hash Table & Doubly Linked List',
        ]);
        const cleaned = stored.filter(c => {
          const id = String(c?.snippetId || c?.id || '');
          const title = String(c?.title || '');
          const isMock = mockIds.has(id) || mockTitles.has(title);
          return !isMock || c?.hasRealPractice || c?.lastPracticedSessionId;
        });
        if (cleaned.length !== stored.length) {
          safeStorageSet(`devtype_cache_srsdue_${uid}`, cleaned);
        }
        MEM_CACHE.srsDue.set(uid, cleaned);
        return cleaned;
      }
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
      if (Array.isArray(stored)) {
        const mockIds = new Set(['cpp-fast-io', 'cp-min-stack', 'merge-sort', 'binary-search-cpp', 'cp-fenwick-tree', 'lru-cache-cpp', 'two-sum-cpp', 'react-use-effect']);
        const mockTitles = new Set([
          'Fast Competitive I/O & Stream Synchronization',
          'Stack Modification: Minimum Stack in O(1)',
          'Merge Sort: Divide & Conquer Recursion',
          'Binary Search Algorithm',
          'Fenwick Tree: Point Updates & Range Sums',
          'LRU Cache: Hash Table & Doubly Linked List',
        ]);
        const cleaned = stored.filter(c => {
          const id = String(c?.snippetId || c?.id || '');
          const title = String(c?.title || '');
          const isMock = mockIds.has(id) || mockTitles.has(title);
          return !isMock || c?.hasRealPractice || c?.lastPracticedSessionId;
        });
        if (cleaned.length !== stored.length) {
          safeStorageSet(`devtype_cache_srsdeck_${uid}`, cleaned);
        }
        MEM_CACHE.srsDeck.set(uid, cleaned);
        return cleaned;
      }
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

  // ── Admin Query Caching ──
  getAdminData(key) {
    if (MEM_CACHE[`admin_${key}`]) {
      return MEM_CACHE[`admin_${key}`];
    }
    const fromStorage = safeStorageGet(`devtype_cache_admin_${key}`);
    if (fromStorage) {
      MEM_CACHE[`admin_${key}`] = fromStorage;
      return fromStorage;
    }
    return null;
  },

  setAdminData(key, data) {
    if (data) {
      MEM_CACHE[`admin_${key}`] = data;
      safeStorageSet(`devtype_cache_admin_${key}`, data);
    }
  },

  async prefetchAdmin() {
    try {
      const [{ adminService }, { snippetService }] = await Promise.all([
        import('./adminService'),
        import('./snippetService'),
      ]);
      return Promise.allSettled([
        adminService.getOverview().then((data) => {
          if (data) {
            this.setAdminData('overview', data);
            this.setAdminData('getOverview', data);
          }
        }),
        adminService.getMetricsSummary().then((data) => {
          if (data) {
            this.setAdminData('metrics', data);
            this.setAdminData('getMetricsSummary', data);
          }
        }),
        adminService.getUsers({ role: 'USER', size: 10, page: 0 }).then((data) => {
          if (data) this.setAdminData('users', data);
        }),
        adminService.getReports({ page: 0, size: 10 }).then((data) => {
          if (data) this.setAdminData('reports', data);
        }),
        adminService.getAuditLogs({ size: 15 }).then((data) => {
          if (data) {
            this.setAdminData('audit', data);
            this.setAdminData('getAuditLogs', data);
          }
        }),
        snippetService.getAllSnippets().then((data) => {
          if (data) {
            this.setAdminData('templates', data);
            this.setTemplates(data);
          }
        }),
      ]);
    } catch {}
  },

  // ── Eager Background Prefetch Engine ──
  async prefetchAll(userId, userObj) {
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

    const isAdmin = userObj?.role === 'ROLE_ADMIN' || userObj?.role === 'ADMIN' || userObj?.isAdmin;
    const pAdmin = isAdmin
      ? Promise.all([
          import('./adminService'),
          import('./snippetService'),
        ]).then(([{ adminService }, { snippetService }]) => {
          return Promise.allSettled([
            adminService.getOverview().then((data) => {
              if (data) {
                this.setAdminData('overview', data);
                this.setAdminData('getOverview', data);
              }
            }),
            adminService.getMetricsSummary().then((data) => {
              if (data) {
                this.setAdminData('metrics', data);
                this.setAdminData('getMetricsSummary', data);
              }
            }),
            adminService.getUsers({ role: 'USER', size: 10, page: 0 }).then((data) => {
              if (data) {
                this.setAdminData('users', data);
              }
            }),
            adminService.getReports({ page: 0, size: 10 }).then((data) => {
              if (data) {
                this.setAdminData('reports', data);
              }
            }),
            adminService.getAuditLogs({ size: 15 }).then((data) => {
              if (data) {
                this.setAdminData('audit', data);
                this.setAdminData('getAuditLogs', data);
              }
            }),
            adminService.getAuditLogs({ size: 5 }).then((data) => {
              if (data) {
                this.setAdminData('overview_audit', data);
              }
            }),
            snippetService.getAllSnippets().then((data) => {
              if (data) {
                this.setAdminData('templates', data);
                this.setTemplates(data);
              }
            }),
          ]);
        }).catch(() => null)
      : Promise.resolve(null);

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
      pAdmin,
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
      const keys = [
        `devtype_cache_dash_${uid}`,
        `devtype_cache_sess_${uid}`,
        `devtype_cache_srsdue_${uid}`,
        `devtype_cache_srsdeck_${uid}`,
        `devtype_cache_ach_${uid}`,
        `devtype_cache_lb_all`,
        `devtype_cache_season_info`,
        `devtype_cache_myrank_${uid}`,
        `devtype_cache_tier_config`,
      ];
      keys.forEach((k) => {
        sessionStorage.removeItem(k);
        localStorage.removeItem(k);
      });
    } catch {}
  },
};

export default dataCache;

