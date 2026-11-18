// src/utils/shortcutsStore.js
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';

export const SHORTCUTS_EVENT_NAME = 'devtype_shortcuts_updated';
export const MAX_SHORTCUTS = 8;

// New users start with 0 shortcuts by default; they pin custom blueprints as desired.
export const DEFAULT_SHORTCUTS = [];

export function getActiveUserId() {
  try {
    const raw = localStorage.getItem('devtype_auth_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id || null;
  } catch {
    return null;
  }
}

export function getShortcutsKey(userId) {
  const uid = userId !== undefined ? userId : getActiveUserId();
  return uid ? `devtype_practice_shortcuts_${uid}` : 'devtype_practice_shortcuts';
}

/**
 * Fetch persisted shortcuts. Authenticated users are strictly scoped by their userId.
 */
export function getStoredShortcuts(userId) {
  try {
    const key = getShortcutsKey(userId);
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out corrupted entries
    const sanitized = parsed.filter(
      (s) => s && s.id && !s.id.includes('undefined') && s.targetId && s.targetId !== 'undefined'
    );
    if (sanitized.length !== parsed.length) {
      localStorage.setItem(key, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (err) {
    console.warn('Failed to parse practice shortcuts:', err);
    return [];
  }
}

/**
 * Synchronize user shortcuts with server preferences.
 */
export async function syncShortcutsWithServer(userId) {
  const uid = userId !== undefined ? userId : getActiveUserId();
  if (!uid) return [];

  try {
    const res = await apiFetch('/api/v1/users/me/preferences');
    const prefs = res?.data !== undefined ? res.data : res;
    let serverList = [];
    if (prefs?.practiceShortcuts) {
      try {
        const parsed = JSON.parse(prefs.practiceShortcuts);
        if (Array.isArray(parsed)) {
          serverList = parsed.filter(
            (s) => s && s.id && !s.id.includes('undefined') && s.targetId && s.targetId !== 'undefined'
          );
        }
      } catch (_) {}
    }
    const key = getShortcutsKey(uid);
    localStorage.setItem(key, JSON.stringify(serverList));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SHORTCUTS_EVENT_NAME, { detail: serverList }));
    }
    return serverList;
  } catch (_) {
    return getStoredShortcuts(uid);
  }
}

/**
 * Persist shortcuts to user-scoped localStorage, mirror to server preferences, and notify listeners.
 */
export function saveShortcuts(shortcuts, userId) {
  try {
    const uid = userId !== undefined ? userId : getActiveUserId();
    const sanitized = Array.isArray(shortcuts)
      ? shortcuts.slice(0, MAX_SHORTCUTS).filter(
          (s) => s && s.id && !s.id.includes('undefined') && s.targetId && s.targetId !== 'undefined'
        )
      : [];
    const key = getShortcutsKey(uid);
    localStorage.setItem(key, JSON.stringify(sanitized));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SHORTCUTS_EVENT_NAME, { detail: sanitized }));
    }

    // Push to server preferences immediately if authenticated
    if (uid) {
      apiFetch('/api/v1/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          practiceShortcuts: JSON.stringify(sanitized),
        }),
      }).catch((err) => {
        console.warn('Failed to mirror shortcuts to server preferences:', err);
      });
    }

    return sanitized;
  } catch (err) {
    console.error('Failed to save practice shortcuts:', err);
    return getStoredShortcuts(userId);
  }
}

/**
 * Add a new shortcut. Returns { success: boolean, message?: string }
 */
export function addShortcut(item, userId) {
  const current = getStoredShortcuts(userId);

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
  saveShortcuts(updated, userId);
  return { success: true };
}

/**
 * Remove shortcut by unique id.
 */
export function removeShortcut(id, userId) {
  const current = getStoredShortcuts(userId);
  const updated = current.filter((s) => s.id !== id);
  saveShortcuts(updated, userId);
  return updated;
}

/**
 * Reorder shortcuts (move item from fromIndex to toIndex).
 */
export function reorderShortcuts(fromIndex, toIndex, userId) {
  const current = [...getStoredShortcuts(userId)];
  if (fromIndex < 0 || fromIndex >= current.length || toIndex < 0 || toIndex >= current.length) {
    return current;
  }
  const [moved] = current.splice(fromIndex, 1);
  current.splice(toIndex, 0, moved);
  saveShortcuts(current, userId);
  return current;
}

/**
 * Reset shortcuts to empty list.
 */
export function resetShortcuts(userId) {
  saveShortcuts([], userId);
  return [];
}

/**
 * Check if a specific template or card is already pinned.
 */
export function isShortcutActive(targetId, lang, userId) {
  if (!targetId || targetId === 'undefined') return false;
  const current = getStoredShortcuts(userId);
  return current.some((s) => {
    if (!s.targetId || s.targetId === 'undefined') return false;
    if (s.id === targetId || s.targetId === targetId) {
      if (!lang) return true;
      return String(s.lang).toLowerCase() === String(lang).toLowerCase();
    }
    return false;
  });
}

/**
 * React hook to access and synchronize practice shortcuts state across browsers.
 */
export function useShortcuts(userId) {
  const [shortcuts, setShortcuts] = useState(() => getStoredShortcuts(userId));

  useEffect(() => {
    if (userId) {
      setShortcuts(getStoredShortcuts(userId));
      syncShortcutsWithServer(userId).then((list) => {
        if (Array.isArray(list)) setShortcuts(list);
      });
    }

    const handleUpdate = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setShortcuts(e.detail);
      } else {
        setShortcuts(getStoredShortcuts(userId));
      }
    };

    window.addEventListener(SHORTCUTS_EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(SHORTCUTS_EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [userId]);

  const add = useCallback((item) => addShortcut(item, userId), [userId]);
  const remove = useCallback((id) => removeShortcut(id, userId), [userId]);
  const reorder = useCallback((from, to) => reorderShortcuts(from, to, userId), [userId]);
  const reset = useCallback(() => resetShortcuts(userId), [userId]);

  return {
    shortcuts,
    addShortcut: add,
    removeShortcut: remove,
    reorderShortcuts: reorder,
    resetShortcuts: reset,
    maxShortcuts: MAX_SHORTCUTS,
  };
}
