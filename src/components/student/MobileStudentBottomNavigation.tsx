import { useState } from 'react';
import { useStudentRoute } from './StudentRouteContext';
import { MOBILE_BOTTOM_ROUTES, STUDENT_ROUTES } from './studentRoutes';
import {
  LayoutDashboard, Compass, Activity, BarChart3, Grid,
  Calendar, Search, ClipboardList, Bookmark, Trophy,
  Sparkles, User, Settings, HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Drawer } from '../ui/Drawer';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, Compass, Activity, BarChart3, Grid,
  Calendar, Search, ClipboardList, Bookmark, Trophy,
  Sparkles, User, Settings, HelpCircle,
};

export function MobileStudentBottomNavigation() {
  const { currentRouteId, navigate, activeSession } = useStudentRoute();
  const [moreOpen, setMoreOpen] = useState(false);

  if (activeSession) return null;

  const moreRoutes = STUDENT_ROUTES.filter(
    (r) => !MOBILE_BOTTOM_ROUTES.some((m) => m.id === r.id)
  );

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-dark-surface border-t border-dark-border safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-2">
          {MOBILE_BOTTOM_ROUTES.map((route) => {
            const Icon = iconMap[route.icon!] || LayoutDashboard;
            const active = currentRouteId === route.id;
            return (
              <button
                key={route.id}
                onClick={() => navigate(route.id)}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-0 px-2 py-1 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
                  active ? 'text-primary-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium truncate max-w-full">{route.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-0 px-2 py-1 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
              moreOpen ? 'text-primary-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Grid className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} side="bottom" title="More">
        <div className="grid grid-cols-3 gap-3 p-4">
          {moreRoutes.map((route) => {
            const Icon = iconMap[route.icon!] || LayoutDashboard;
            return (
              <button
                key={route.id}
                onClick={() => { navigate(route.id); setMoreOpen(false); }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-dark-elevated hover:bg-dark-surface-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                <Icon className="h-5 w-5 text-gray-400" />
                <span className="text-[10px] font-medium text-gray-400 text-center leading-tight">{route.label}</span>
              </button>
            );
          })}
        </div>
      </Drawer>
    </>
  );
}
