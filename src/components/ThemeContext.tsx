/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Role } from '../types';
import { apiFetch } from '../api/client';
import { loginRequest, registerRequest, getMeRequest } from '../api/auth.api';
import { getNotifications, markNotificationRead as markNotifRead, markAllNotificationsRead as markAllNotifRead, triggerSeed as triggerSeedApi } from '../api/student.api';

interface NotificationItem {
  id: string;
  title: string;
  text: string;
  read: boolean;
  createdAt?: string;
}

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  role: Role;
  setRole: (role: Role) => void;
  user: { id: string; name: string; email: string; subTier?: string; targetScore?: number; currentAvg?: number } | null;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string, targetScore?: number) => Promise<void>;
  logout: () => void;
  notifications: NotificationItem[];
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
  streakCount: number;
  addStreakDay: () => void;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  isLoading: boolean;
  triggerSeed: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [role, setRoleState] = useState<Role>('guest');
  const [user, setUser] = useState<{ id: string; name: string; email: string; targetScore?: number; currentAvg?: number } | null>(null);
  const [streakCount, setStreakCount] = useState<number>(14);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('pte_token');
      if (token) {
        try {
          const profile = await getMeRequest();
          setUser(profile);
          setRoleState(profile.role);

          if (profile.role === 'student') {
            const notifs = await getNotifications();
            setNotifications(notifs);
          }
        } catch (err) {
          console.error('Session restoration failed:', err);
          localStorage.removeItem('pte_token');
          setUser(null);
          setRoleState('guest');
        }
      }
      setIsLoading(false);
    };

    initSession();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (role === 'student' && user) {
      const interval = setInterval(async () => {
        try {
          const notifs = await getNotifications();
          setNotifications(notifs);
        } catch (err) {
          // Silent catch
        }
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [role, user]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await loginRequest(email, password);
      localStorage.setItem('pte_token', result.token);
      setUser(result.user);
      setRoleState(result.user.role);

      if (result.user.role === 'student') {
        const notifs = await getNotifications();
        setNotifications(notifs);
      }
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    }
    setIsLoading(false);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, userRole = 'student', targetScore = 79) => {
    setIsLoading(true);
    try {
      const result = await registerRequest(name, email, password, userRole, targetScore);
      localStorage.setItem('pte_token', result.token);
      setUser(result.user);
      setRoleState(result.user.role);

      if (result.user.role === 'student') {
        const notifs = await getNotifications();
        setNotifications(notifs);
      }
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pte_token');
    setUser(null);
    setRoleState('guest');
    setNotifications([]);
  }, []);

  const triggerSeed = useCallback(async () => {
    try {
      await triggerSeedApi();
    } catch (err) {
      console.error('Auto-seed failed:', err);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getMeRequest();
      setUser(profile);
    } catch {
      console.warn('Failed to refresh user profile');
    }
  }, []);

  const setRole = useCallback(async (newRole: Role) => {
    const isDemoMode = import.meta.env.VITE_DEMO_MODE !== 'false';
    if (!isDemoMode) {
      console.warn('Role switching is only available in demo mode');
      return;
    }

    if (newRole === 'guest') {
      logout();
      return;
    }

    try {
      if (newRole === 'student') {
        await login('student@example.com', 'password123');
      } else if (newRole === 'teacher') {
        await login('teacher@example.com', 'password123');
      } else if (newRole === 'admin') {
        await login('admin@example.com', 'password123');
      }
    } catch (err) {
      console.warn('Seeded accounts not found. Triggering auto-seed...');
      try {
        await triggerSeed();
        if (newRole === 'student') await login('student@example.com', 'password123');
        else if (newRole === 'teacher') await login('teacher@example.com', 'password123');
        else if (newRole === 'admin') await login('admin@example.com', 'password123');
      } catch (seedErr) {
        setRoleState(newRole);
        setUser({
          id: 'local-sim-id',
          name: newRole === 'teacher' ? 'Evelyn Carter' : newRole === 'admin' ? 'Administrator' : 'Heidi Dang',
          email: `${newRole}@pteacademic.org`,
          targetScore: 79,
          currentAvg: 70
        });
      }
    }
  }, [login, logout, triggerSeed]);

  const markAllNotificationsRead = useCallback(async () => {
    if (role !== 'student') return;
    try {
      await markAllNotifRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  }, [role]);

  const markNotificationRead = useCallback(async (id: string) => {
    if (role !== 'student') return;
    try {
      await markNotifRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to read notification:', err);
    }
  }, [role]);

  const addStreakDay = useCallback(() => {
    setStreakCount((prev) => prev + 1);
  }, []);

  const contextValue = useMemo(() => ({
    theme,
    toggleTheme,
    role,
    setRole,
    user,
    login,
    register,
    logout,
    notifications,
    markAllNotificationsRead,
    markNotificationRead,
    streakCount,
    addStreakDay,
    apiFetch,
    isLoading,
    triggerSeed,
    refreshUser,
  }), [
    theme,
    toggleTheme,
    role,
    setRole,
    user,
    login,
    register,
    logout,
    notifications,
    markAllNotificationsRead,
    markNotificationRead,
    streakCount,
    addStreakDay,
    isLoading,
    triggerSeed,
    refreshUser,
  ]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0b0f19] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a ThemeProvider');
  }
  return context;
};
