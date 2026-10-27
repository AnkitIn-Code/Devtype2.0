// src/utils/templateStore.js
import { SNIPPETS } from '../data/snippets';

const STORAGE_KEY = 'devtype_custom_templates';

export const LANG_COLORS = {
  'C++': '#2563EB',
  Python: '#4F46E5',
  JavaScript: '#D97706',
  TypeScript: '#0284C7',
  Java: '#DC2626',
  SQL: '#0D9488',
  Rust: '#EA580C',
  Go: '#059669',
};

export const DIFFICULTY_CONFIG = {
  Beginner: {
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.1)',
    border: 'rgba(5, 150, 105, 0.22)',
    label: 'Beginner',
  },
  Intermediate: {
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.1)',
    border: 'rgba(217, 119, 6, 0.22)',
    label: 'Intermediate',
  },
  Advanced: {
    color: '#E11D48',
    bg: 'rgba(225, 29, 72, 0.1)',
    border: 'rgba(225, 29, 72, 0.22)',
    label: 'Advanced',
  },
  BEGINNER: {
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.1)',
    border: 'rgba(5, 150, 105, 0.22)',
    label: 'Beginner',
  },
  INTERMEDIATE: {
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.1)',
    border: 'rgba(217, 119, 6, 0.22)',
    label: 'Intermediate',
  },
  ADVANCED: {
    color: '#E11D48',
    bg: 'rgba(225, 29, 72, 0.1)',
    border: 'rgba(225, 29, 72, 0.22)',
    label: 'Advanced',
  },
};

/**
 * Retrieve user-created templates from localStorage safely.
 */
export function getStoredCustomTemplates() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load custom templates from localStorage', err);
    return [];
  }
}

/**
 * Get all available templates combining custom and default library.
 */
export function getAllTemplates() {
  const custom = getStoredCustomTemplates();
  // Ensure custom templates appear first, with an isCustom flag
  const customMarked = custom.map((t) => ({ ...t, isCustom: true }));
  return [...customMarked, ...SNIPPETS];
}

/**
 * Find a template by ID in both custom and built-in libraries.
 */
export function getTemplateById(id) {
  if (!id) return null;
  const all = getAllTemplates();
  return all.find((t) => t.id === id) || null;
}

/**
 * Save a newly created custom template to localStorage.
 */
export function saveCustomTemplate({ title, language, difficulty, description, code, tags = [] }) {
  const custom = getStoredCustomTemplates();
  const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanCode = code.trim();
  const charCount = cleanCode.length;
  // Estimate XP based on length and difficulty
  const diffMultiplier = difficulty === 'Advanced' ? 1.5 : difficulty === 'Intermediate' ? 1.2 : 1.0;
  const xp = Math.max(25, Math.min(100, Math.round((charCount / 15) * diffMultiplier)));

  const newTemplate = {
    id,
    title: title.trim(),
    language,
    difficulty,
    description: description.trim() || 'Custom community template.',
    xp,
    code: cleanCode,
    popularity: 100, // Newly created gets top spotlight
    createdAt: new Date().toISOString().split('T')[0],
    tags: tags.length > 0 ? tags : ['Custom'],
    isCustom: true,
  };

  const updated = [newTemplate, ...custom];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save custom template to localStorage', err);
  }

  return newTemplate;
}

/**
 * Delete a user-created template.
 */
export function deleteCustomTemplate(id) {
  const custom = getStoredCustomTemplates();
  const updated = custom.filter((t) => t.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove custom template', err);
  }
  return updated;
}

/**
 * Estimate typing duration based on standard 40 WPM (~200 chars/min).
 */
export function estimateTypingTime(code = '') {
  const chars = code.length;
  const seconds = Math.max(10, Math.round((chars / 200) * 60));
  if (seconds < 60) {
    return `~${seconds}s`;
  }
  const mins = (seconds / 60).toFixed(1);
  return `~${mins} min`;
}
