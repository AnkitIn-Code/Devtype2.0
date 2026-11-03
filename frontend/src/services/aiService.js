// src/services/aiService.js
import { apiFetch } from './api';

export const aiService = {
  /**
   * Generates a code typing template using Fireworks AI and DeepSeek V4 Pro.
   * @param {{ language: string, difficulty: string, topic: string, exerciseType?: string, targetLength?: string, customInstructions?: string }} payload
   */
  async generateTemplate(payload) {
    const res = await apiFetch('/api/v1/ai/templates/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res?.data;
  },

  /**
   * Persists an AI-generated template into the authenticated user's private library.
   * @param {{ title: string, description?: string, language: string, difficulty: string, category?: string, content: string, estimatedDurationSeconds: number }} payload
   */
  async saveTemplate(payload) {
    const res = await apiFetch('/api/v1/ai/templates/save', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res?.data;
  },

  /**
   * Retrieves all saved AI templates authored by the authenticated user.
   */
  async getSavedTemplates() {
    const res = await apiFetch('/api/v1/ai/templates/saved', {
      method: 'GET',
    });
    return res?.data || [];
  },

  /**
   * Returns the authenticated user's remaining hourly AI generation quota.
   */
  async getQuota() {
    const res = await apiFetch('/api/v1/ai/quota', {
      method: 'GET',
    });
    return res?.data;
  },
};
