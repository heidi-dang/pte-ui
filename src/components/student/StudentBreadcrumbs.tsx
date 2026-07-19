import { ChevronRight } from 'lucide-react';
import { useStudentRoute } from './StudentRouteContext';
import { STUDENT_ROUTES } from './studentRoutes';

export function StudentBreadcrumbs() {
  const { currentRouteId, navigate, activeSession } = useStudentRoute();

  if (activeSession) return null;

  const currentRoute = STUDENT_ROUTES.find((r) => r.id === currentRouteId);
  if (!currentRoute) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4" aria-label="Breadcrumb">
      <button
        onClick={() => navigate('dashboard')}
        className="hover:text-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded"
      >
        Home
      </button>
      <ChevronRight className="h-3 w-3" />
      <span className="text-gray-300 font-medium truncate">{currentRoute.label}</span>
    </nav>
  );
}
