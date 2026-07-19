import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { useGlobalContext } from '../ThemeContext';
import { useStudentRoute } from './StudentRouteContext';
import { IconButton } from '../ui/IconButton';

interface StudentPortalHeaderProps {
  onMenuToggle: () => void;
}

export function StudentPortalHeader({ onMenuToggle }: StudentPortalHeaderProps) {
  const { theme, toggleTheme, user, logout, notifications } = useGlobalContext();
  const { activeSession } = useStudentRoute();

  if (activeSession) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-dark-surface/80 backdrop-blur-md border-b border-dark-border">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-dark-elevated transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            label="Toggle theme"
            onClick={toggleTheme}
            size="sm"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </IconButton>

          <button
            className="relative p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-dark-elevated transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary-500 ring-2 ring-dark-surface" />
            )}
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-dark-border">
            <div className="h-7 w-7 rounded-full bg-primary-500/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-400">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="hidden sm:inline text-xs font-medium text-gray-300 truncate max-w-[120px]">
              {user?.name || 'User'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
