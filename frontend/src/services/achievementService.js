// src/services/achievementService.js
import { apiFetch } from './api';

/**
 * Service for fetching platform and user-specific achievements.
 */
export const achievementService = {
  /**
   * Retrieves achievements with unlock status and progress for authenticated user.
   * If unauthenticated, falls back to the public catalog.
   *
   * @returns {Promise<Array<Object>>} List of achievements
   */
  async getAchievements() {
    const token = localStorage.getItem('devtype_auth_token');
    const endpoint = token ? '/api/v1/users/me/achievements' : '/api/v1/achievements';
    const response = await apiFetch(endpoint, { method: 'GET' });
    return response?.data || [];
  },

  /**
   * Retrieves the authenticated user's XP and level progression details.
   *
   * @returns {Promise<Object>} Level progression details
   */
  async getUserXpProgression() {
    const response = await apiFetch('/api/v1/users/me/xp', { method: 'GET' });
    return response?.data || null;
  },
};
