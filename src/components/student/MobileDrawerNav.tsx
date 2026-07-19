import { useStudentRoute } from './StudentRouteContext';
import { STUDENT_ROUTES } from './studentRoutes';
import {
  LayoutDashboard, Compass, Activity, Calendar, BarChart3, Search,
  ClipboardList, Bookmark, Trophy, Sparkles, User, Settings, HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, Compass, Activity, Calendar, BarChart3, Search,
  ClipboardList, Bookmark, Trophy, Sparkles, User, Settings, HelpCircle,
};

interface MobileDrawerNavProps {
  onNavigate: () => void;
}

export function MobileDrawerNav({ onNavigate }: MobileDrawerNavProps) {
  const { currentRouteId, navigate } = useStudentRoute();

  const primaryRoutes = STUDENT_ROUTES.filter((r) => r.group === 'primary');
  const secondaryRoutes = STUDENT_ROUTES.filter((r) => r.group === 'secondary');
  const tertiaryRoutes = STUDENT_ROUTES.filter((r) => r.group === 'tertiary');

  const renderLink = (route: typeof STUDENT_ROUTES[0]) => {
    const Icon = iconMap[route.icon!] || LayoutDashboard;
    const active = currentRouteId === route.id;

    return (
      <button
        key={route.id}
        onClick={() => { navigate(route.id); onNavigate(); }}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
          active
            ? 'bg-primary-500/10 text-primary-400'
            : 'text-gray-400 hover:text-gray-200 hover:bg-dark-elevated'
        }`}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
        <span>{route.label}</span>
      </button>
    );
  };

  return (
    <nav className="space-y-4">
      <div>
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-600 px-3 mb-1">Main</p>
        {primaryRoutes.map(renderLink)}
      </div>
      <div>
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-600 px-3 mb-1">Learning</p>
        {secondaryRoutes.map(renderLink)}
      </div>
      <div>
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-600 px-3 mb-1">Account</p>
        {tertiaryRoutes.map(renderLink)}
      </div>
    </nav>
  );
}
