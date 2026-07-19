import { useStudentRoute } from './StudentRouteContext';
import { STUDENT_ROUTES } from './studentRoutes';
import {
  LayoutDashboard, Compass, Activity, Calendar, BarChart3, Search,
  ClipboardList, Bookmark, Trophy, Sparkles, User, Settings, HelpCircle,
  Clock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, Compass, Activity, Calendar, BarChart3, Search,
  ClipboardList, Bookmark, Trophy, Sparkles, User, Settings, HelpCircle, Clock,
};

interface DesktopStudentSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function DesktopStudentSidebar({ collapsed, onToggle }: DesktopStudentSidebarProps) {
  const { currentRouteId, navigate, activeSession } = useStudentRoute();

  if (activeSession) return null;

  const primaryRoutes = STUDENT_ROUTES.filter((r) => r.group === 'primary');
  const secondaryRoutes = STUDENT_ROUTES.filter((r) => r.group === 'secondary');
  const tertiaryRoutes = STUDENT_ROUTES.filter((r) => r.group === 'tertiary');

  const renderLink = (route: typeof STUDENT_ROUTES[0]) => {
    const Icon = iconMap[route.icon!] || LayoutDashboard;
    const active = currentRouteId === route.id;

    return (
      <button
        key={route.id}
        onClick={() => navigate(route.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
          active
            ? 'bg-primary-500/10 text-primary-400'
            : 'text-gray-400 hover:text-gray-200 hover:bg-dark-elevated'
        } ${collapsed ? 'justify-center px-2' : ''}`}
        title={collapsed ? route.label : undefined}
      >
        {Icon && <Icon className={`shrink-0 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'}`} />}
        {!collapsed && <span className="truncate">{route.label}</span>}
        {route.badge !== undefined && !collapsed && (
          <span className="ml-auto bg-primary-500/20 text-primary-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {route.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className={`hidden lg:flex flex-col bg-dark-surface border-r border-dark-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-display font-bold text-lg shrink-0">
          P
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-sm text-white truncate">
            PTE Academic <span className="text-primary-400">Master</span>
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        <div className="space-y-0.5">
          {primaryRoutes.map(renderLink)}
        </div>

        {!collapsed && <div className="my-3 border-t border-dark-border" />}
        <div className="space-y-0.5">
          {secondaryRoutes.map(renderLink)}
        </div>

        {!collapsed && <div className="my-3 border-t border-dark-border" />}
        <div className="space-y-0.5">
          {tertiaryRoutes.map(renderLink)}
        </div>
      </nav>

      <div className="p-3 border-t border-dark-border">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-dark-elevated transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
        >
          {collapsed ? '→' : 'Collapse'}
        </button>
      </div>
    </aside>
  );
}
