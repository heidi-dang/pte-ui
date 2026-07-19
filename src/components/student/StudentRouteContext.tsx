import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { StudentRouteId, StudentRoute } from './studentRoutes';
import { STUDENT_ROUTES, getRouteByPath } from './studentRoutes';

interface StudentRouteContextType {
  currentRouteId: StudentRouteId;
  currentRoute: StudentRoute | undefined;
  navigate: (id: StudentRouteId) => void;
  navigateToPath: (path: string) => void;
  previousRouteId: StudentRouteId | null;
  activeSession: boolean;
  setActiveSession: (active: boolean) => void;
}

const StudentRouteContext = createContext<StudentRouteContextType | null>(null);

export function StudentRouteProvider({ children }: { children: ReactNode }) {
  const [currentRouteId, setCurrentRouteId] = useState<StudentRouteId>('dashboard');
  const [previousRouteId, setPreviousRouteId] = useState<StudentRouteId | null>(null);
  const [activeSession, setActiveSession] = useState(false);

  const navigate = useCallback((id: StudentRouteId) => {
    setPreviousRouteId((prev) => {
      if (prev !== currentRouteId) return currentRouteId;
      return prev;
    });
    setCurrentRouteId(id);
  }, [currentRouteId]);

  const navigateToPath = useCallback((path: string) => {
    const route = getRouteByPath(path);
    if (route) navigate(route.id);
  }, [navigate]);

  const value = useMemo(() => ({
    currentRouteId,
    currentRoute: getRouteByPath(`/student/${currentRouteId}`),
    navigate,
    navigateToPath,
    previousRouteId,
    activeSession,
    setActiveSession,
  }), [currentRouteId, navigate, navigateToPath, previousRouteId, activeSession]);

  return (
    <StudentRouteContext.Provider value={value}>
      {children}
    </StudentRouteContext.Provider>
  );
}

export function useStudentRoute() {
  const ctx = useContext(StudentRouteContext);
  if (!ctx) throw new Error('useStudentRoute must be used within StudentRouteProvider');
  return ctx;
}
