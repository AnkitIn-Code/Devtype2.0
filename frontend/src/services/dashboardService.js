// src/services/dashboardService.js
import { apiFetch } from './api';

/**
 * Service for communicating with backend dashboard endpoints.
 */
export const dashboardService = {
  /**
   * Fetches the authenticated user's dashboard statistics, streak data,
   * recent sessions, and daily activity points for the heatmap.
   *
   * @returns {Promise<Object>} Dashboard summary
   */
  async getDashboardSummary() {
    try {
      const response = await apiFetch('/api/v1/dashboard', { method: 'GET' });
      return response?.data || null;
    } catch (err) {
      // Fallback to /api/v1/users/me/dashboard if route mapping dictates
      if (err.status === 404) {
        const fallback = await apiFetch('/api/v1/users/me/dashboard', { method: 'GET' });
        return fallback?.data || null;
      }
      throw err;
    }
  },
};
