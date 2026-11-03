import { apiFetch } from './api';

export const supportService = {
  /**
   * Fetch all support and moderation tickets submitted by the authenticated user.
   */
  async getMyTickets() {
    const res = await apiFetch('/api/v1/reports/my-tickets');
    return res.data || [];
  },

  /**
   * Submit a new user support ticket.
   */
  async submitTicket({ title, category, priority = 'NORMAL', description }) {
    const res = await apiFetch('/api/v1/reports/ticket', {
      method: 'POST',
      body: JSON.stringify({
        title,
        category,
        priority,
        description,
      }),
    });
    return res.data;
  },

  /**
   * System-automated anti-cheat incident dispatch.
   */
  async reportAntiCheat({ violationType, mode, details }) {
    try {
      const res = await apiFetch('/api/v1/reports/anti-cheat', {
        method: 'POST',
        body: JSON.stringify({
          violationType,
          mode,
          details,
        }),
      });
      return res.data;
    } catch (err) {
      console.warn('Anti-cheat incident logging error:', err);
      return null;
    }
  },
};
