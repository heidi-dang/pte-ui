import { useState, type ReactNode } from 'react';
import { StudentRouteProvider } from './StudentRouteContext';
import { DesktopStudentSidebar } from './DesktopStudentSidebar';
import { MobileStudentBottomNavigation } from './MobileStudentBottomNavigation';
import { StudentPortalHeader } from './StudentPortalHeader';
import { Drawer } from '../ui/Drawer';
import { MobileDrawerNav } from './MobileDrawerNav';

interface StudentPortalShellProps {
  children: ReactNode;
}

export function StudentPortalShellContent({ children }: StudentPortalShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-dark-surface">
      <DesktopStudentSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <StudentPortalHeader onMenuToggle={() => setMobileDrawerOpen(true)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>

        <MobileStudentBottomNavigation />
      </div>

      <Drawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        side="left"
        title="Navigation"
      >
        <MobileDrawerNav onNavigate={() => setMobileDrawerOpen(false)} />
      </Drawer>
    </div>
  );
}

export function StudentPortalShell({ children }: StudentPortalShellProps) {
  return (
    <StudentRouteProvider>
      <StudentPortalShellContent>
        {children}
      </StudentPortalShellContent>
    </StudentRouteProvider>
  );
}
