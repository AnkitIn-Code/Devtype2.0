// src/context/NotificationContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const NotificationContext = createContext(null);
const NOTIF_STORAGE_KEY = 'devtype_notifications_v2';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Daily Challenge Unlocked',
    message: 'Complete the "LRU Cache Lexer" in under 90 seconds to earn +150 XP and a streak bonus.',
    time: '5m ago',
    timestamp: Date.now() - 5 * 60 * 1000,
    read: false,
    type: 'challenge',
    link: '/challenges',
  },
  {
    id: 'notif-2',
    title: 'Telemetry Engine Active',
    message: 'Sub-millisecond keystroke telemetry & burst cadence tracking calibrated for your profile.',
    time: '25m ago',
    timestamp: Date.now() - 25 * 60 * 1000,
    read: false,
    type: 'system',
    link: '/dashboard',
  },
  {
    id: 'notif-3',
    title: 'Welcome to DevType v2.0',
    message: 'Master syntax speed, muscle memory, and algorithmic velocity with liquid glass telemetry.',
    time: '1h ago',
    timestamp: Date.now() - 60 * 60 * 1000,
    read: true,
    type: 'achievement',
    link: '/practice',
  },
];

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [activeToast, setActiveToast] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // storage full or disabled
    }
  }, [notifications]);

  // Auto-dismiss active toast after 4.5 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const addNotification = useCallback(({ title, message, type = 'system', link = null }) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title,
      message,
      time: 'Just now',
      timestamp: Date.now(),
      read: false,
      type,
      link,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    // Trigger toast notification
    setActiveToast(newNotif);
    return newNotif;
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const showSuccess = useCallback((message, title = 'Success') => {
    return addNotification({ title, message, type: 'achievement' });
  }, [addNotification]);

  const showError = useCallback((message, title = 'Error') => {
    return addNotification({ title, message, type: 'system' });
  }, [addNotification]);

  const value = {
    notifications,
    unreadCount,
    activeToast,
    addNotification,
    showSuccess,
    showError,
    markAsRead,
    markAllAsRead,
    clearAll,
    dismissToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}

export const useNotification = useNotifications;
