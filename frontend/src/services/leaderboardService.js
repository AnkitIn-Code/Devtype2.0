// src/services/leaderboardService.js
import { apiFetch } from './api';

/**
 * Service for fetching global and regional developer leaderboard rankings.
 */
export const leaderboardService = {
  /**
   * Retrieves leaderboard rankings based on timeframe and sorting metric.
   *
   * @param {string} timeframe 'allTime' | 'thisMonth' | 'thisWeek' | 'today'
   * @param {string} metric 'wpm' | 'xp'
   * @returns {Promise<Array<Object>>} List of ranked developers
   */
  async getLeaderboard(timeframe = 'allTime', metric = 'wpm') {
    try {
      const query = new URLSearchParams({ timeframe, metric }).toString();
      const response = await apiFetch(`/api/v1/leaderboard?${query}`, { method: 'GET' });
      return response?.data || [];
    } catch (err) {
      console.warn('Live leaderboard REST endpoint unreachable, using client store:', err);
      return [];
    }
  },
};
