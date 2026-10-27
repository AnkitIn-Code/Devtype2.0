// src/services/srsService.js
import { apiFetch } from './api';
import { calculateNextSrsReview, deriveQualityScore } from '../utils/srsEngine';

const LOCAL_SRS_KEY = 'devtype_srs_deck';

const DEFAULT_DECK = [
  {
    id: 1,
    snippetId: 'binary-search-cpp',
    title: 'Binary Search',
    language: 'cpp',
    repetition: 0,
    easeFactor: 2.50,
    intervalDays: 1,
    dueDate: new Date().toISOString(),
    lastReviewedAt: null,
    lastQualityScore: 0,
    category: 'Algorithms & DSA',
  },
  {
    id: 2,
    snippetId: 'two-sum-cpp',
    title: 'Two Sum',
    language: 'cpp',
    repetition: 1,
    easeFactor: 2.60,
    intervalDays: 6,
    dueDate: new Date(Date.now() - 3600000).toISOString(),
    lastReviewedAt: new Date(Date.now() - 86400000).toISOString(),
    lastQualityScore: 4,
    category: 'Algorithms & DSA',
  },
  {
    id: 3,
    snippetId: 'react-use-effect',
    title: 'React useEffect Hook',
    language: 'javascript',
    repetition: 0,
    easeFactor: 2.50,
    intervalDays: 1,
    dueDate: new Date(Date.now() - 1800000).toISOString(),
    lastReviewedAt: null,
    lastQualityScore: 0,
    category: 'Modern Frameworks (React)',
  },
  {
    id: 4,
    snippetId: 'lru-cache-cpp',
    title: 'LRU Cache',
    language: 'cpp',
    repetition: 2,
    easeFactor: 2.50,
    intervalDays: 15,
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    lastReviewedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastQualityScore: 5,
    category: 'Algorithms & DSA',
  },
];

function getLocalDeck() {
  try {
    const raw = localStorage.getItem(LOCAL_SRS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_SRS_KEY, JSON.stringify(DEFAULT_DECK));
      return DEFAULT_DECK;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read local SRS deck:', err);
    return DEFAULT_DECK;
  }
}

function saveLocalDeck(deck) {
  try {
    localStorage.setItem(LOCAL_SRS_KEY, JSON.stringify(deck));
  } catch (err) {
    console.error('Failed to persist local SRS deck:', err);
  }
}

export const srsService = {
  getLocalDeck,
  saveLocalDeck,

  async getDueCards() {
    try {
      const res = await apiFetch('/api/v1/srs/due');
      const data = res?.data || res;
      if (Array.isArray(data)) {
        return data;
      }
    } catch {
      // Offline fallback
    }
    const deck = getLocalDeck();
    const now = new Date();
    return deck.filter((c) => !c.dueDate || new Date(c.dueDate) <= now);
  },

  async getDeck() {
    try {
      const res = await apiFetch('/api/v1/srs/deck');
      const data = res?.data || res;
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

    const snippetId = payload.snippetId || String(firstArg);
    const title = payload.title || payload.snippetTitle || snippetId;
    const language = payload.language || 'javascript';
    const qualityScore = typeof payload.qualityScore === 'number' ? payload.qualityScore : 4;
    const netWpm = payload.netWpm || 0;
    const accuracy = typeof payload.accuracy === 'number' ? payload.accuracy : 100;

    // 1. Always update local storage for instant responsive UX & offline durability
    const deck = getLocalDeck();
    let cardIdx = deck.findIndex((c) => c.snippetId === snippetId || String(c.id) === snippetId);
    let card = cardIdx >= 0 ? deck[cardIdx] : {
      id: Date.now(),
      snippetId,
      title: title || snippetId,
      language: language || 'javascript',
      repetition: 0,
      easeFactor: 2.50,
      intervalDays: 1,
      dueDate: new Date().toISOString(),
      lastReviewedAt: null,
      lastQualityScore: 0,
      category: 'Custom Review',
    };

    const nextSchedule = calculateNextSrsReview(
      card.repetition || 0,
      card.easeFactor || 2.50,
      card.intervalDays || 1,
      qualityScore
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
      deck.push(updatedCard);
    }
    saveLocalDeck(deck);

    // 2. Try pushing to server if authenticated
    try {
      const res = await apiFetch('/api/v1/srs/review', {
        method: 'POST',
        body: JSON.stringify({
          snippetId,
          snippetTitle: title,
          language,
          qualityScore,
          netWpm: Math.round(netWpm || 0),
          accuracy: typeof accuracy === 'number' ? accuracy : 100,
        }),
      });
      const data = res?.data || res;
      if (data) {
        return data;
      }
    } catch {
      // Offline mode succeeded
    }

    return updatedCard;
  },

  async registerSnippetToSrs(snippet) {
    const deck = getLocalDeck();
    const existing = deck.find((c) => c.snippetId === snippet.id || c.snippetId === snippet.slug);
    if (existing) return existing;

    const newCard = {
      id: Date.now(),
      snippetId: snippet.id || snippet.slug,
      title: snippet.title,
      language: snippet.language || 'cpp',
      repetition: 0,
      easeFactor: 2.50,
      intervalDays: 1,
      dueDate: new Date().toISOString(),
      lastReviewedAt: null,
      lastQualityScore: 0,
      category: snippet.category || 'General',
    };

    deck.unshift(newCard);
    saveLocalDeck(deck);
    return newCard;
  },
};

export default srsService;
