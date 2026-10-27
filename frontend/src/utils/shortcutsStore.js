// src/utils/shortcutsStore.js
import { useState, useEffect, useCallback } from 'react';

export const SHORTCUTS_STORAGE_KEY = 'devtype_practice_shortcuts';
export const SHORTCUTS_EVENT_NAME = 'devtype_shortcuts_updated';
export const MAX_SHORTCUTS = 8;

export const DEFAULT_SHORTCUTS = [
  {
    id: 'shortcut-cpp-lru-cache',
    name: 'LRU Cache',
    lang: 'C++',
    source: 'template',
    targetId: 'cpp-lru-cache',
    to: '/practice?snippet=cpp-lru-cache&lang=C%2B%2B',
  },
  {
    id: 'shortcut-cpp-binary-search',
    name: 'Binary Search',
    lang: 'C++',
    source: 'template',
    targetId: 'cpp-binary-search',
    to: '/practice?snippet=cpp-binary-search&lang=C%2B%2B',
  },
  {
    id: 'shortcut-py-two-sum',
    name: 'Two Sum',
    lang: 'Python',
    source: 'template',
    targetId: 'py-two-sum',
    to: '/practice?snippet=py-two-sum&lang=Python',
  },
  {
    id: 'shortcut-js-debounce',
    name: 'Debounce Fn',
    lang: 'JS',
    source: 'template',
    targetId: 'js-debounce',
    to: '/practice?snippet=js-debounce&lang=JavaScript',
  },
];

/**
 * Fetch persisted shortcuts or fallback to defaults.
 */
export function getStoredShortcuts() {
  try {
    const raw = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (!raw) return DEFAULT_SHORTCUTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SHORTCUTS;
  } catch (err) {
    console.warn('Failed to parse practice shortcuts:', err);
    return DEFAULT_SHORTCUTS;
  }
}

/**
 * Persist shortcuts to localStorage and notify all listeners.
 */
export function saveShortcuts(shortcuts) {
  try {
    const sanitized = Array.isArray(shortcuts) ? shortcuts.slice(0, MAX_SHORTCUTS) : [];
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new CustomEvent(SHORTCUTS_EVENT_NAME, { detail: sanitized }));
    return sanitized;
  } catch (err) {
    console.error('Failed to save practice shortcuts:', err);
    return getStoredShortcuts();
  }
}

/**
 * Add a new shortcut. Returns { success: boolean, message?: string }
 */
export function addShortcut(item) {
  const current = getStoredShortcuts();

  // Check if already reached max capacity
  if (current.length >= MAX_SHORTCUTS) {
    return {
      success: false,
      message: `Maximum capacity reached (${MAX_SHORTCUTS} shortcuts). Remove an existing shortcut first.`,
    };
  }

  // Check if item already exists (match by targetId or to URL)
  const isDuplicate = current.some(
    (s) => s.id === item.id || (s.targetId && s.targetId === item.targetId && s.lang === item.lang) || s.to === item.to
  );

  if (isDuplicate) {
    return {
      success: false,
      message: `"${item.name}" (${item.lang}) is already pinned to your shortcuts.`,
    };
  }

  const updated = [...current, item];
  saveShortcuts(updated);
  return { success: true };
}

/**
 * Remove shortcut by unique id.
 */
export function removeShortcut(id) {
  const current = getStoredShortcuts();
  const updated = current.filter((s) => s.id !== id);
  saveShortcuts(updated);
  return updated;
}

/**
 * Reorder shortcuts (move item from fromIndex to toIndex).
 */
export function reorderShortcuts(fromIndex, toIndex) {
  const current = [...getStoredShortcuts()];
  if (fromIndex < 0 || fromIndex >= current.length || toIndex < 0 || toIndex >= current.length) {
    return current;
  }
  const [moved] = current.splice(fromIndex, 1);
  current.splice(toIndex, 0, moved);
  saveShortcuts(current);
  return current;
}

/**
 * Reset to default shortcuts.
 */
export function resetShortcuts() {
  saveShortcuts(DEFAULT_SHORTCUTS);
  return DEFAULT_SHORTCUTS;
}

/**
 * Check if a specific template or card is already pinned.
 */
export function isShortcutActive(targetId, lang) {
  const current = getStoredShortcuts();
  return current.some((s) => {
    if (s.id === targetId || s.targetId === targetId) {
      if (!lang) return true;
      return String(s.lang).toLowerCase() === String(lang).toLowerCase();
    }
    return false;
  });
}

/**
 * React hook to access and synchronize practice shortcuts state.
 */
export function useShortcuts() {
  const [shortcuts, setShortcuts] = useState(() => getStoredShortcuts());

  useEffect(() => {
    const handleUpdate = () => {
      setShortcuts(getStoredShortcuts());
    };

    window.addEventListener(SHORTCUTS_EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(SHORTCUTS_EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const add = useCallback((item) => addShortcut(item), []);
  const remove = useCallback((id) => removeShortcut(id), []);
  const reorder = useCallback((from, to) => reorderShortcuts(from, to), []);
  const reset = useCallback(() => resetShortcuts(), []);

  return {
    shortcuts,
    addShortcut: add,
    removeShortcut: remove,
    reorderShortcuts: reorder,
    resetShortcuts: reset,
    maxShortcuts: MAX_SHORTCUTS,
  };
}
