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
  time: string;
  read: boolean;
}

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  role: Role;
  setRole: (role: Role) => void;
  user: { name: string; email: string } | null;
  login: (email: string) => void;
  logout: () => void;
  notifications: NotificationItem[];
  markAllNotificationsRead: () => void;
  streakCount: number;
  addStreakDay: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // Default to sleek premium dark theme
  const [role, setRoleState] = useState<Role>('student'); // Start in student dashboard for immediate interaction
  const [user, setUser] = useState<{ name: string; email: string } | null>({
    name: 'Heidi Dang',
    email: 'heidi.dang.dev@gmail.com'
  });
  const [streakCount, setStreakCount] = useState<number>(14); // Interactive mock streak

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 'n1', title: 'New Essay Graded', text: 'Your response to "Automation & Employment" has been reviewed by Teacher Carter.', time: '10 mins ago', read: false },
    { id: 'n2', title: 'Weekly Goal Completed!', text: 'You completed 15 speaking tasks this week. Keep it up!', time: '2 hours ago', read: false },
    { id: 'n3', title: 'Mock Test Ready', text: 'Mini Mock Test #3 is open for submission.', time: '1 day ago', read: true }
  ]);

  useEffect(() => {
    // Sync class list with root HTML
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (newRole === 'guest') {
      setUser(null);
    } else if (!user) {
      setUser({
        name: newRole === 'teacher' ? 'Evelyn Carter' : newRole === 'admin' ? 'Administrator' : 'Heidi Dang',
        email: newRole === 'teacher' ? 'evelyn@pteacademic.org' : newRole === 'admin' ? 'admin@pteacademic.org' : 'heidi.dang.dev@gmail.com'
      });
    }
  };

  const login = (email: string) => {
    setUser({
      name: email.split('@')[0].toUpperCase(),
      email: email
    });
    setRoleState('student');
  };

  const logout = () => {
    setUser(null);
    setRoleState('guest');
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addStreakDay = () => {
    setStreakCount((prev) => prev + 1);
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
        logout,
        notifications,
        markAllNotificationsRead,
        streakCount,
        addStreakDay
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
