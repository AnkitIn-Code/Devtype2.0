// src/services/snippetService.js
import { apiFetch } from './api.js';

const getStorageKey = (userId) => {
  return userId ? `devtype_custom_templates_${userId}` : 'devtype_custom_templates';
};

/**
 * Service for managing user-created custom snippets and blueprints.
 * Provides dual-layer persistence: REST endpoints against the Spring Boot backend
 * with transparent user-scoped localStorage synchronization for offline capability.
 */
export const snippetService = {
  /**
   * Fetches only custom snippets created by the specified user.
   */
  async getCustomSnippets(userId) {
    let serverSnippets = [];
    if (userId) {
      try {
        const res = await apiFetch(`/api/v1/snippets/user/${userId}`);
        if (Array.isArray(res)) {
          serverSnippets = res;
        } else if (res?.data && Array.isArray(res.data)) {
          serverSnippets = res.data;
        } else if (res?.content && Array.isArray(res.content)) {
          serverSnippets = res.content;
        }
      } catch (err) {
        console.warn('Backend user snippet fetch failed, relying on localStorage:', err.message);
      }
    }

    let localSnippets = [];
    const storageKey = getStorageKey(userId);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        localSnippets = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse local snippets:', e);
    }

    // Merge server and local, only keeping items created by the user
    const map = new Map();
    localSnippets.forEach((s) => map.set(s.id || s.slug, s));
    serverSnippets.forEach((s) => {
      const id = s.id ? String(s.id) : s.slug;
      map.set(id, {
        id,
        slug: s.slug || id,
        title: s.title,
        language: s.language,
        difficulty: s.difficulty,
        category: s.category || 'Custom Drills',
        subCategory: s.subCategory,
        code: s.code,
        content: s.code,
        tags: Array.isArray(s.tags) ? s.tags : (s.tags ? s.tags.split(',') : []),
        isCustom: true,
        xpBounty: s.xpBounty || 60,
        createdAt: s.createdAt,
      });
    });

    const merged = Array.from(map.values());
    try {
      localStorage.setItem(storageKey, JSON.stringify(merged));
    } catch (_) {}

    return merged;
  },

  /**
   * Creates a new snippet.
   */
  async createSnippet(snippetData, userId) {
    const payload = {
      title: snippetData.title,
      language: snippetData.language,
      difficulty: snippetData.difficulty || 'Intermediate',
      category: snippetData.category || 'Custom Drills',
      subCategory: snippetData.subCategory || null,
      code: snippetData.code,
      tags: Array.isArray(snippetData.tags) ? snippetData.tags : [],
      xpBounty: snippetData.xpBounty || 60,
    };

    let saved = null;
    try {
      saved = await apiFetch('/api/v1/snippets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Server snippet creation failed, persisting locally:', err.message);
    }

    const localItem = {
      id: saved?.id ? String(saved.id) : `custom-${Date.now()}`,
      slug: saved?.slug || `custom-${Date.now()}`,
      title: payload.title,
      language: payload.language,
      difficulty: payload.difficulty,
      category: payload.category,
      subCategory: payload.subCategory,
      code: payload.code,
      content: payload.code,
      tags: payload.tags,
      drillMode: snippetData.drillMode || 'standard',
      srsEnabled: false,
      isCustom: true,
      xpBounty: payload.xpBounty,
      createdAt: new Date().toISOString(),
    };

    // Update user-scoped local storage
    const storageKey = getStorageKey(userId);
    try {
      const raw = localStorage.getItem(storageKey);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(localItem);
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (_) {}

    return localItem;
  },

  /**
   * Updates an existing snippet.
   */
  async updateSnippet(id, snippetData, userId) {
    const payload = {
      title: snippetData.title,
      language: snippetData.language,
      difficulty: snippetData.difficulty,
      category: snippetData.category || 'Custom Drills',
      subCategory: snippetData.subCategory || null,
      code: snippetData.code,
      tags: Array.isArray(snippetData.tags) ? snippetData.tags : [],
      xpBounty: snippetData.xpBounty || 60,
    };

    // Try backend if numeric id
    if (!String(id).startsWith('custom-')) {
      try {
        await apiFetch(`/api/v1/snippets/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('Server snippet update failed, updating locally:', err.message);
      }
    }

    // Update in user-scoped localStorage
    const storageKey = getStorageKey(userId);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const list = JSON.parse(raw);
        const idx = list.findIndex((s) => s.id === id || s.slug === id);
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            ...payload,
            content: payload.code,
            drillMode: snippetData.drillMode || list[idx].drillMode || 'standard',
            srsEnabled: false,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(storageKey, JSON.stringify(list));
          return list[idx];
        }
      }
    } catch (_) {}

    return { id, ...payload };
  },

  /**
   * Deletes a snippet by ID.
   */
  async deleteSnippet(id, userId) {
    if (!String(id).startsWith('custom-')) {
      try {
        await apiFetch(`/api/v1/snippets/${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('Server snippet delete failed, deleting locally:', err.message);
      }
    }

    const storageKey = getStorageKey(userId);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const list = JSON.parse(raw).filter((s) => s.id !== id && s.slug !== id);
        localStorage.setItem(storageKey, JSON.stringify(list));
      }
    } catch (_) {}

    return true;
  },
};
