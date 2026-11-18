// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { dataCache } from '../services/dataCache';
import { syncShortcutsWithServer } from '../utils/shortcutsStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => authService.getToken());
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [isLoading, setIsLoading] = useState(() => {
    // Stale-while-revalidate: if valid token & profile are cached, render immediately without blocking
    return !(authService.getToken() && authService.getStoredUser());
  });

  // Eager prefetch user & admin data as early as possible
  useEffect(() => {
    if (user?.id) {
      dataCache.prefetchAll(user.id, user);
    }
  }, [user]);

  // Validate or synchronize authentication state on boot
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const activeToken = authService.getToken();
      if (!activeToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const freshProfile = await authService.getCurrentUser();
        if (isMounted && freshProfile) {
          setUser(freshProfile);
          setToken(activeToken);
          syncShortcutsWithServer(freshProfile.id);
          // Kick off background prefetch immediately
          dataCache.prefetchAll(freshProfile.id, freshProfile);
        }
      } catch (err) {
        // If server returns 401 Unauthorized, token has expired or is invalid
        if (err.status === 401) {
          authService.logout();
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
        } else {
          // If network failed or server unreachable, keep existing cached user if present
          const cachedUser = authService.getStoredUser();
          if (isMounted && cachedUser) {
            setUser(cachedUser);
            setToken(activeToken);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize XP & level telemetry updates across application in real time
  useEffect(() => {
    const handleXpUpdated = (e) => {
      if (e.detail?.totalXp !== undefined) {
        setUser((prev) => {
          if (!prev) return prev;
          const next = {
            ...prev,
            totalXp: e.detail.totalXp,
            level: e.detail.level !== undefined ? e.detail.level : prev.level,
            levelProgressPercent: e.detail.levelProgressPercent !== undefined ? e.detail.levelProgressPercent : prev.levelProgressPercent,
          };
          authService.setStoredUser(next);
          return next;
        });
      }
    };

    window.addEventListener('devtype_xp_updated', handleXpUpdated);
    return () => {
      window.removeEventListener('devtype_xp_updated', handleXpUpdated);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const authData = await authService.login(credentials);
    setToken(authData?.accessToken || null);
    setUser(authData?.user || null);
    if (authData?.user?.id) {
      dataCache.prefetchAll(authData.user.id, authData.user);
      syncShortcutsWithServer(authData.user.id);
      // Fetch full server profile in background to ensure 100% authoritative telemetry
      authService.getCurrentUser().then((profile) => {
        if (profile) {
          setUser(profile);
          authService.setStoredUser(profile);
        }
      }).catch(() => {});
    }
    return authData;
  }, []);

  const register = useCallback(async (formData) => {
    const authData = await authService.register(formData);
    // If backend returns access token upon registration, establish authenticated state
    if (authData?.accessToken) {
      setToken(authData.accessToken);
      setUser(authData.user || null);
    }
    return authData;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const freshProfile = await authService.getCurrentUser();
      setUser(freshProfile);
      return freshProfile;
    } catch (err) {
      if (err.status === 401) {
        logout();
      }
      throw err;
    }
  }, [logout]);

  const updateUser = useCallback((userData) => {
    setUser((prev) => {
      const next = typeof userData === 'function' ? userData(prev) : { ...prev, ...userData };
      authService.setStoredUser(next);
      return next;
    });
  }, []);

  const deleteAccount = useCallback(async () => {
    const currentId = user?.id;
    await authService.deleteAccount();
    if (currentId) {
      dataCache.clearUserCache(currentId);
    }
    setToken(null);
    setUser(null);
  }, [user?.id]);

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout,
    deleteAccount,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
