// src/services/leaderboardService.js
import { apiFetch } from './api';

/**
 * Service for fetching authoritative competitive leaderboard rankings,
 * season metadata, and player rank progression directly from the database.
 */
export const leaderboardService = {
  /**
   * Retrieves competitive leaderboard rankings directly from the database.
   *
   * @param {string} tier 'all' | 'Ace' | 'Crown' | 'Diamond' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze'
   * @returns {Promise<Array<Object>>} List of real database-ranked competitors
   */
  async getLeaderboard(tier = 'all') {
    try {
      const query = new URLSearchParams({ tier }).toString();
      const response = await apiFetch(`/api/v1/leaderboard?${query}`, { method: 'GET' });
      return response?.data || [];
    } catch (err) {
      console.warn('Leaderboard database API unreachable:', err);
      return [];
    }
  },

  /**
   * Retrieves active season metadata, days remaining, active competitors count,
   * and previous season's champion.
   */
  async getSeasonInfo() {
    try {
      const response = await apiFetch('/api/v1/leaderboard/season', { method: 'GET' });
      return response?.data || null;
    } catch (err) {
      console.warn('Season info database API unreachable:', err);
      return null;
    }
  },

  /**
   * Retrieves current authenticated user's rank, BGMI tier progress, and next season reset preview.
   */
  async getMyRank() {
    try {
      const response = await apiFetch('/api/v1/leaderboard/my-rank', { method: 'GET' });
      return response?.data || null;
    } catch (err) {
      console.warn('User rank database API unreachable:', err);
      return null;
    }
  },

  /**
   * Records a completed ranked multiplayer match to the PostgreSQL database.
   */
  async recordMatch(matchData) {
    try {
      const response = await apiFetch('/api/v1/leaderboard/record-match', {
        method: 'POST',
        body: JSON.stringify(matchData),
      });
      return response?.data || null;
    } catch (err) {
      console.warn('Failed to record match to database:', err);
      return null;
    }
  },

  /**
   * Retrieves authenticated user's recent match history directly from database records.
   * Returns empty array for newly created accounts.
   */
  async getMyMatches() {
    try {
      const response = await apiFetch('/api/v1/leaderboard/matches/me', { method: 'GET' });
      return response?.data || [];
    } catch (err) {
      console.warn('Failed to fetch user match history from database:', err);
      return [];
    }
  },

  /**
   * Admin trigger to end season and execute BGMI tier reduction.
   */
  async rolloverSeason() {
    const response = await apiFetch('/api/v1/leaderboard/rollover-season', { method: 'POST' });
    return response?.data || null;
  },
};

