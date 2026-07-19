import { Moon, Sun, Monitor } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { useGlobalContext } from '../../ThemeContext';

export function SettingsPage() {
  const { theme, toggleTheme } = useGlobalContext();

  return (
    <StudentPageContainer title="Settings" maxWidth="md">
      <div className="rounded-xl border border-dark-border bg-dark-surface overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="h-5 w-5 text-primary-400" />
            ) : (
              <Sun className="h-5 w-5 text-amber-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-200">Dark Mode</p>
              <p className="text-xs text-gray-500">Toggle between dark and light theme</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
              theme === 'dark' ? 'bg-primary-500' : 'bg-dark-elevated'
            }`}
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Toggle dark mode"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>
    </StudentPageContainer>
  );
}
