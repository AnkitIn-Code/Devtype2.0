// src/services/srsService.js
import { apiFetch } from './api';
import { calculateNextSrsReview, isCardDue } from '../utils/srsEngine';

const LOCAL_SRS_KEY = 'devtype_srs_deck';

const DEFAULT_DECK = [
  {
    id: 1,
    snippetId: 'cpp-fast-io',
    title: 'Fast Competitive I/O & Stream Synchronization',
    language: 'C++',
    repetition: 0,
    easeFactor: 2.50,
    intervalDays: 1,
    isMastered: false,
    dueDate: new Date().toISOString(),
    lastReviewedAt: null,
    lastQualityScore: 0,
    category: 'C++ Foundations',
  },
  {
    id: 2,
    snippetId: 'cp-min-stack',
    title: 'Stack Modification: Minimum Stack in O(1)',
    language: 'C++',
    repetition: 1,
    easeFactor: 2.60,
    intervalDays: 3,
    isMastered: false,
    dueDate: new Date(Date.now() - 3600000).toISOString(),
    lastReviewedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    lastQualityScore: 4,
    category: 'Competitive Algorithms',
  },
  {
    id: 3,
    snippetId: 'merge-sort',
    title: 'Merge Sort: Divide & Conquer Recursion',
    language: 'C++',
    repetition: 0,
    easeFactor: 2.50,
    intervalDays: 1,
    isMastered: false,
    dueDate: new Date(Date.now() - 1800000).toISOString(),
    lastReviewedAt: null,
    lastQualityScore: 0,
    category: 'Algorithms & DSA',
  },
  {
    id: 4,
    snippetId: 'binary-search-cpp',
    title: 'Binary Search Algorithm',
    language: 'C++',
    repetition: 4,
    easeFactor: 2.70,
    intervalDays: null,
    isMastered: true,
    dueDate: null,
    lastReviewedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastQualityScore: 5,
    category: 'Algorithms & DSA',
  },
  {
    id: 5,
    snippetId: 'cp-fenwick-tree',
    title: 'Fenwick Tree: Point Updates & Range Sums',
    language: 'C++',
    repetition: 2,
    easeFactor: 2.50,
    intervalDays: 8,
    isMastered: false,
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
    lastReviewedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    lastQualityScore: 4,
    category: 'Competitive Algorithms',
  },
  {
    id: 6,
    snippetId: 'lru-cache-cpp',
    title: 'LRU Cache: Hash Table & Doubly Linked List',
    language: 'C++',
    repetition: 3,
    easeFactor: 2.60,
    intervalDays: 15,
    isMastered: false,
    dueDate: new Date(Date.now() + 86400000 * 9).toISOString(),
    lastReviewedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    lastQualityScore: 5,
    category: 'Data Structures',
  },
];

function getActiveUserId() {
  try {
    const raw = localStorage.getItem('devtype_auth_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id || null;
  } catch {
    return null;
  }
}

function getLocalSrsKey() {
  const userId = getActiveUserId();
  return userId ? `devtype_srs_deck_${userId}` : 'devtype_srs_deck';
}

function getLocalDeck() {
  try {
    const key = getLocalSrsKey();
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_DECK));
      return DEFAULT_DECK;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_DECK;
  } catch (err) {
    console.error('Failed to read local SRS deck:', err);
    return DEFAULT_DECK;
  }
}

function saveLocalDeck(deck) {
  try {
    const key = getLocalSrsKey();
    localStorage.setItem(key, JSON.stringify(deck));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('devtype_srs_updated', { detail: deck }));
    }
  } catch (err) {
    console.error('Failed to persist local SRS deck:', err);
  }
}

export function computeCardRetention(card) {
  if (!card) return 75;
  if (typeof card.retention === 'number' && card.retention > 0) return Math.round(card.retention);
  const ef = Number(card.easeFactor || 2.50);
  const rep = Math.min(5, Number(card.repetition || 0));
  const masteryBonus = card.isMastered ? 14 : 0;
  const score = Math.round(ef * 24 + rep * 4.5 + masteryBonus);
  return Math.min(99, Math.max(60, score));
}

export const srsService = {
  getLocalDeck,
  saveLocalDeck,
  computeCardRetention,

  async getDueCards() {
    try {
      const res = await apiFetch('/api/v1/srs/due');
      const data = res?.data !== undefined ? res.data : res;
      if (Array.isArray(data)) {
        return data.filter(c => !c.isMastered && (!c.dueDate || new Date(c.dueDate) <= new Date()));
      }
    } catch {
      // Offline fallback
    }
    const deck = getLocalDeck();
    return deck.filter((c) => isCardDue(c));
  },

  async getDeck() {
    try {
      const res = await apiFetch('/api/v1/srs/deck');
      const data = res?.data !== undefined ? res.data : res;
      if (Array.isArray(data)) {
        return data;
      }
    } catch {
      // Offline fallback
    }
    return getLocalDeck();
  },

  async submitReview(firstArg, secondArg, thirdArg) {
    const payload = typeof firstArg === 'object' && firstArg !== null
      ? firstArg
      : {
          snippetId: String(firstArg),
          qualityScore: typeof secondArg === 'number' ? secondArg : 4,
          ...(thirdArg || {}),
        };

    const snippetId = String(payload.snippetId || firstArg);
    const title = payload.title || payload.snippetTitle || snippetId;
    const language = payload.language || 'C++';
    const qualityScore = typeof payload.qualityScore === 'number' ? payload.qualityScore : 4;
    const netWpm = typeof payload.netWpm === 'number' ? payload.netWpm : 0;
    const accuracy = typeof payload.accuracy === 'number' ? payload.accuracy : 100;
    const errorCount = typeof payload.errorCount === 'number' ? payload.errorCount : (typeof payload.errors === 'number' ? payload.errors : 0);

    // 1. Always update local storage with deterministic benchmark scheduling
    const deck = getLocalDeck();
    let cardIdx = deck.findIndex((c) => c.snippetId === snippetId || String(c.id) === snippetId);
    let card = cardIdx >= 0 ? deck[cardIdx] : {
      id: Date.now(),
      snippetId,
      title: title || snippetId,
      language: language || 'C++',
      repetition: 0,
      easeFactor: 2.50,
      intervalDays: 1,
      isMastered: false,
      dueDate: new Date().toISOString(),
      lastReviewedAt: null,
      lastQualityScore: 0,
      category: payload.category || 'Algorithmic Drills',
    };

    const nextSchedule = calculateNextSrsReview(
      card.repetition || 0,
      card.easeFactor || 2.50,
      card.intervalDays || 1,
      qualityScore,
      netWpm,
      accuracy,
      errorCount
    );

    const updatedCard = {
      ...card,
      ...nextSchedule,
      title: title || card.title,
      language: language || card.language,
    };

    if (cardIdx >= 0) {
      deck[cardIdx] = updatedCard;
    } else {
      deck.unshift(updatedCard);
    }
    saveLocalDeck(deck);

    // 2. Sync to Spring Boot Backend
    try {
      const res = await apiFetch('/api/v1/srs/review', {
        method: 'POST',
        body: JSON.stringify({
          snippetId,
          snippetTitle: title,
          language,
          qualityScore: nextSchedule.lastQualityScore,
          netWpm: Math.round(netWpm || 0),
          accuracy: typeof accuracy === 'number' ? accuracy : 100,
          errorCount: Math.round(errorCount || 0),
        }),
      });
      const data = res?.data || res;
      if (data) {
        return { ...updatedCard, ...data };
      }
    } catch {
      // Offline fallback succeeded
    }

    return updatedCard;
  },

  async registerSnippetToSrs(snippet) {
    if (!snippet) return null;
    const deck = getLocalDeck();
    const snippetKey = snippet.slug || snippet.id;
    const existing = deck.find((c) => c.snippetId === snippetKey || c.snippetId === snippet.id);
    if (existing) return existing;

    const newCard = {
      id: Date.now(),
      snippetId: snippetKey,
      title: snippet.title || 'Untitled Snippet',
      language: snippet.language || 'C++',
      repetition: 0,
      easeFactor: 2.50,
      intervalDays: 1,
      isMastered: false,
      dueDate: new Date().toISOString(),
      lastReviewedAt: null,
      lastQualityScore: 0,
      category: snippet.category || 'Custom Studio',
    };

    deck.unshift(newCard);
    saveLocalDeck(deck);

    // Try registering to server if online
    try {
      await apiFetch('/api/v1/srs/review', {
        method: 'POST',
        body: JSON.stringify({
          snippetId: snippetKey,
          snippetTitle: newCard.title,
          language: newCard.language,
          qualityScore: 3,
          netWpm: 0,
          accuracy: 100,
        }),
      });
    } catch (_) {}

    return newCard;
  },
};

export default srsService;
