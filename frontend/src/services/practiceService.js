// src/services/practiceService.js
import { apiFetch } from './api';

/**
 * Service for managing practice session lifecycle and user practice history.
 */
export const practiceService = {
  /**
   * Initializes a new server-side practice session.
   *
   * @param {Object} params
   * @param {number|string} [params.templateId]
   * @param {string} [params.templateSlug]
   * @returns {Promise<Object>} Created session data
   */
  async startSession({
    templateId,
    templateSlug,
    customTitle,
    customLanguage,
    customDifficulty,
    customContent,
  } = {}) {
    const payload = {};
    if (templateId != null && !isNaN(Number(templateId))) {
      payload.templateId = Number(templateId);
    }
    if (templateSlug) {
      payload.templateSlug = templateSlug;
    }
    if (customContent) {
      payload.customContent = customContent;
      payload.customTitle = customTitle || 'Custom Practice';
      payload.customLanguage = customLanguage || 'plaintext';
      payload.customDifficulty = customDifficulty || 'INTERMEDIATE';
    }

    const response = await apiFetch('/api/v1/practice-sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response?.data || null;
  },

  /**
   * Completes an in-progress practice session, calculating server-authoritative metrics.
   *
   * @param {number|string} sessionId
   * @param {Object} completionData
   * @param {number} completionData.totalKeystrokes
   * @param {number} completionData.correctCharacters
   * @param {number} [completionData.incorrectCharacters]
   * @param {number} [completionData.errorCount]
   * @param {number} [completionData.elapsedMs]
   * @param {string} [completionData.typedText]
   * @returns {Promise<Object>} Completed session metrics
   */
  async completeSession(sessionId, completionData) {
    if (!sessionId) {
      throw new Error('Session ID is required to complete practice session');
    }

    const payload = {
      totalKeystrokes: completionData.totalKeystrokes ?? 0,
      correctCharacters: completionData.correctCharacters ?? 0,
      incorrectCharacters: completionData.incorrectCharacters ?? 0,
      errorCount: completionData.errorCount ?? 0,
      elapsedMs: completionData.elapsedMs ?? 0,
    };

    if (completionData.typedText) {
      payload.typedText = completionData.typedText;
    }

    const response = await apiFetch(`/api/v1/practice-sessions/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response?.data || null;
  },

  /**
   * Abandons an in-progress practice session.
   *
   * @param {number|string} sessionId
   * @returns {Promise<Object>} Abandoned session record
   */
  async abandonSession(sessionId) {
    if (!sessionId) return null;

    try {
      const response = await apiFetch(`/api/v1/practice-sessions/${sessionId}/abandon`, {
        method: 'POST',
      });
      return response?.data || null;
    } catch (err) {
      console.warn(`Failed to abandon practice session ${sessionId}:`, err);
      return null;
    }
  },

  /**
   * Retrieves paginated practice sessions for the authenticated user.
   *
   * @param {Object} [params]
   * @param {string} [params.status] 'COMPLETED', 'ABANDONED', 'IN_PROGRESS'
   * @param {string} [params.language]
   * @param {string} [params.difficulty]
   * @param {number} [params.page=0]
   * @param {number} [params.size=10]
   * @param {string} [params.sort='startedAt,desc']
   * @returns {Promise<Object>} Paginated session results
   */
  async getUserSessions(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'All') {
      query.set('status', params.status);
    }
    if (params.language && params.language !== 'All') {
      query.set('language', params.language);
    }
    if (params.difficulty && params.difficulty !== 'All') {
      query.set('difficulty', params.difficulty.toUpperCase());
    }
    if (params.page != null) {
      query.set('page', params.page);
    }
    if (params.size != null) {
      query.set('size', params.size);
    }
    if (params.sort) {
      query.set('sort', params.sort);
    }

    const queryString = query.toString();
    const endpoint = `/api/v1/practice-sessions/me${queryString ? `?${queryString}` : ''}`;
    const response = await apiFetch(endpoint, { method: 'GET' });

    return response?.data || { items: [], totalElements: 0, totalPages: 0, page: 0 };
  },

  /**
   * Retrieves single session detail.
   *
   * @param {number|string} sessionId
   * @returns {Promise<Object>}
   */
  async getSessionById(sessionId) {
    if (!sessionId) return null;
    const response = await apiFetch(`/api/v1/practice-sessions/${sessionId}`, {
      method: 'GET',
    });
    return response?.data || null;
  },
};
