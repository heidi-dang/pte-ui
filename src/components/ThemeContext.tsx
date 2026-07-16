/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role } from '../types';

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
  user: { id: string; name: string; email: string; targetScore?: number; currentAvg?: number } | null;
  login: (email: string, password?: string) => Promise<void>;
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
  const [role, setRoleState] = useState<Role>('guest'); // Start on guest, or load session if available
  const [user, setUser] = useState<{ id: string; name: string; email: string; targetScore?: number; currentAvg?: number } | null>(null);
  const [streakCount, setStreakCount] = useState<number>(14);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Central API Fetch utility with Token Injection
  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('pte_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const config = {
      ...options,
      headers: {
        ...headers,
        ...((options.headers as any) || {}),
      },
    };

    const response = await fetch(path, config);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP error ${response.status}`);
    }
    return response.json();
  };

  // 2. Fetch User Profile & Notifications on Mount (if token exists)
  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('pte_token');
      if (token) {
        try {
          const profile = await apiFetch('/api/auth/me');
          setUser(profile);
          setRoleState(profile.role);
          
          if (profile.role === 'student') {
            const notifs = await apiFetch('/api/student/notifications');
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

  // Update theme tag on document
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Periodic notifications refetch for students
  useEffect(() => {
    if (role === 'student' && user) {
      const interval = setInterval(async () => {
        try {
          const notifs = await apiFetch('/api/student/notifications');
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

  // 3. User Login
  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const payload = {
        email,
        password: password || 'password123', // support mock login default passwords
      };

      const result = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      localStorage.setItem('pte_token', result.token);
      setUser(result.user);
      setRoleState(result.user.role);

      if (result.user.role === 'student') {
        const notifs = await apiFetch('/api/student/notifications');
        setNotifications(notifs);
      }
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    }
    setIsLoading(false);
  };

  // 4. User Registration
  const register = async (name: string, email: string, password: string, userRole = 'student', targetScore = 79) => {
    setIsLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        role: userRole,
        targetScore,
      };

      const result = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      localStorage.setItem('pte_token', result.token);
      setUser(result.user);
      setRoleState(result.user.role);

      if (result.user.role === 'student') {
        const notifs = await apiFetch('/api/student/notifications');
        setNotifications(notifs);
      }
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    }
    setIsLoading(false);
  };

  // 5. Logout
  const logout = () => {
    localStorage.removeItem('pte_token');
    setUser(null);
    setRoleState('guest');
    setNotifications([]);
  };

  // 6. Set Role (Simulated dashboard switching for rapid testing)
  const setRole = async (newRole: Role) => {
    if (newRole === 'guest') {
      logout();
      return;
    }

    // Direct dashboard switching mapping to seeded test accounts
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
        // Fallback local simulation if server fails
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
  };

  // 7. Mark all notifications as read
  const markAllNotificationsRead = async () => {
    if (role !== 'student') return;
    try {
      await apiFetch('/api/student/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  // 8. Mark single notification as read
  const markNotificationRead = async (id: string) => {
    if (role !== 'student') return;
    try {
      await apiFetch(`/api/student/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to read notification:', err);
    }
  };

  const addStreakDay = () => {
    setStreakCount((prev) => prev + 1);
  };

  // 9. Database Auto-Seed trigger
  const triggerSeed = async () => {
    try {
      await apiFetch('/api/seed', { method: 'POST' });
    } catch (err) {
      console.error('Auto-seed failed:', err);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
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
        triggerSeed
      }}
    >
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
