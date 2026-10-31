import { apiFetch } from './api.js';
import { PREDEFINED_BLUEPRINTS, getPredefinedSnippet, normalizeLanguageName } from '../data/predefinedBlueprints';
import { SNIPPETS } from '../data/snippets';

/**
 * Normalizes backend PracticeTemplate DTOs to match frontend UI component contracts.
 */
export function normalizeTemplate(t) {
  if (!t) return null;
  const rawDiff = t.difficulty || 'INTERMEDIATE';
  const capitalizedDiff =
    rawDiff.charAt(0).toUpperCase() + rawDiff.slice(1).toLowerCase();
  const codeContent = t.content || t.code || '';
  const displayLang = t.language || 'Java';
  const filename =
    t.fileName ||
    `${(t.slug || t.title || 'snippet')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')}.${displayLang.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  return {
    ...t,
    id: t.slug || String(t.id),
    numericId: t.id,
    templateId: t.id,
    slug: t.slug || t.id,
    title: t.title || 'Untitled Template',
    language: displayLang,
    difficulty: capitalizedDiff,
    rawDifficulty: rawDiff,
    description: t.description || '',
    category: t.category || 'General',
    code: codeContent,
    content: codeContent,
    fileName: filename,
    tags: t.tags || [t.category, capitalizedDiff].filter(Boolean),
    xp:
      t.xp ||
      (capitalizedDiff === 'Advanced'
        ? 100
        : capitalizedDiff === 'Intermediate'
        ? 60
        : 30),
    lineCount: t.lineCount || (codeContent ? codeContent.split('\n').length : 0),
    characterCount: t.characterCount || codeContent.length,
    estimatedDurationSeconds: t.estimatedDurationSeconds || 90,
  };
}

/**
 * Builds static predefined templates list as a resilient fallback
 */
function getStaticFallbackTemplates() {
  const items = [];
  for (const bp of PREDEFINED_BLUEPRINTS) {
    for (const [lang, code] of Object.entries(bp.codeByLanguage || {})) {
      const slug = bp.slugs?.[lang] || `${bp.key}-${lang.toLowerCase().replace('+', 'p')}`;
      items.push({
        id: slug,
        slug,
        title: `${bp.title} (${lang})`,
        language: lang,
        difficulty: bp.difficulty,
        category: bp.category,
        description: bp.description,
        content: code,
        code,
        isPublished: true,
      });
    }
  }
  return items.map(normalizeTemplate);
}

/**
 * Service for communicating with backend practice-template REST endpoints.
 */
export const templateService = {
  /**
   * Fetches published templates with optional filtering, search, pagination, and sorting.
   */
  async getTemplates(params = {}) {
    try {
      const query = new URLSearchParams();

      if (params.language && params.language !== 'All') {
        query.set('language', params.language);
      }
      if (params.difficulty && params.difficulty !== 'All') {
        query.set('difficulty', params.difficulty.toUpperCase());
      }
      if (
        params.category &&
        params.category !== 'All Collections' &&
        params.category !== 'All'
      ) {
        query.set('category', params.category);
      }
      if (params.search && params.search.trim()) {
        query.set('search', params.search.trim());
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
      const endpoint = `/api/v1/templates${queryString ? `?${queryString}` : ''}`;
      const response = await apiFetch(endpoint, { method: 'GET' });

      const pageData = response?.data || {};
      const rawItems = Array.isArray(pageData.items)
        ? pageData.items
        : Array.isArray(pageData.content)
        ? pageData.content
        : [];

      if (rawItems.length > 0) {
        const normalizedItems = rawItems.map(normalizeTemplate);
        return {
          items: normalizedItems,
          content: normalizedItems,
          totalElements: pageData.totalElements ?? normalizedItems.length,
          totalPages: pageData.totalPages ?? (normalizedItems.length > 0 ? 1 : 0),
          page: pageData.page ?? (params.page || 0),
          size: pageData.size ?? (params.size || 12),
          first: pageData.first ?? ((params.page || 0) === 0),
          last: pageData.last ?? true,
          hasNext: pageData.hasNext ?? false,
          hasPrevious: pageData.hasPrevious ?? false,
        };
      }
    } catch (err) {
      console.warn('Backend templates API unavailable, using predefined catalog:', err.message);
    }

    // Fallback to rich pre-seeded blueprints
    let staticList = getStaticFallbackTemplates();
    if (params.language && params.language !== 'All') {
      const targetLang = normalizeLanguageName(params.language).toLowerCase();
      staticList = staticList.filter(t => t.language.toLowerCase() === targetLang);
    }
    if (params.difficulty && params.difficulty !== 'All') {
      staticList = staticList.filter(t => t.difficulty.toLowerCase() === params.difficulty.toLowerCase());
    }
    if (params.category && params.category !== 'All Collections' && params.category !== 'All') {
      staticList = staticList.filter(t => t.category.toLowerCase() === params.category.toLowerCase());
    }
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      staticList = staticList.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.language.toLowerCase().includes(q)
      );
    }

    const page = params.page || 0;
    const size = params.size || 12;
    const pagedItems = staticList.slice(page * size, (page + 1) * size);

    return {
      items: pagedItems,
      content: pagedItems,
      totalElements: staticList.length,
      totalPages: Math.ceil(staticList.length / size) || 1,
      page,
      size,
      first: page === 0,
      last: (page + 1) * size >= staticList.length,
      hasNext: (page + 1) * size < staticList.length,
      hasPrevious: page > 0,
    };
  },

  /**
   * Fetches full template details by ID or unique slug, strictly respecting language requests.
   */
  async getTemplateById(idOrSlug, preferredLang = null) {
    if (!idOrSlug) return null;

    // 1. Resolve from predefined blueprints first (fast 0ms sync, prevents 404s for standard blueprints)
    const predefined = getPredefinedSnippet(idOrSlug, preferredLang);
    if (predefined) {
      return normalizeTemplate(predefined);
    }

    try {
      const response = await apiFetch(`/api/v1/templates/${encodeURIComponent(idOrSlug)}`, {
        method: 'GET',
      });
      if (response?.data) {
        return normalizeTemplate(response.data);
      }
    } catch (_) {
      // API call failed or returned 404
    }

    try {
      const snippetRes = await apiFetch(`/api/v1/snippets/${encodeURIComponent(idOrSlug)}`, {
        method: 'GET',
      });
      if (snippetRes?.code) {
        return normalizeTemplate(snippetRes);
      }
    } catch (_) {
      // Snippet call failed or returned 404
    }

    // 2. Resolve from static SNIPPETS catalog
    const staticMatch = SNIPPETS.find(
      s => s.id === idOrSlug || s.fileName === idOrSlug || s.title.toLowerCase() === String(idOrSlug).toLowerCase()
    );
    if (staticMatch) {
      return normalizeTemplate(staticMatch);
    }

    // 3. Resolve from custom user templates in localStorage (matching ID/slug only, NEVER blindly [0])
    const rawCustom = localStorage.getItem('devtype_custom_templates');
    if (rawCustom) {
      try {
        const list = JSON.parse(rawCustom);
        const match = list.find(s => s.id === idOrSlug || s.slug === idOrSlug);
        if (match) return normalizeTemplate(match);
      } catch (_) {}
    }

    // 4. Default fallback: only return binary search if specifically requested or empty
    if (!idOrSlug || idOrSlug === 'binary-search' || String(idOrSlug).includes('binary-search')) {
      return normalizeTemplate(getPredefinedSnippet('binary-search', preferredLang || 'C++'));
    }
    return null;
  },

  /**
   * Fetches distinct programming languages of published templates.
   */
  async getLanguages() {
    try {
      const response = await apiFetch('/api/v1/templates/languages', { method: 'GET' });
      if (Array.isArray(response?.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (_) {}
    return ['C++', 'C', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'SQL'];
  },

  /**
   * Fetches distinct categories of published templates.
   */
  async getCategories() {
    try {
      const response = await apiFetch('/api/v1/templates/categories', { method: 'GET' });
      if (Array.isArray(response?.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (_) {}
    return ['Algorithms & DSA', 'Data Structures', 'Frameworks & Modern', 'Concurrency & Systems', 'SQL & Analytics'];
  },
};
