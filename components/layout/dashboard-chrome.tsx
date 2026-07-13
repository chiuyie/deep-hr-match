import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { DashboardLayoutProvider } from "./dashboard-layout-context";

import type { UserRole } from "@/types/database";

interface DashboardChromeProps {
  role: UserRole;
  userName?: string | null;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function DashboardChrome({
  role,
  userName,
  title,
  description,
  children,
  actions,
}: DashboardChromeProps) {
  return (
    <DashboardLayoutProvider>
      <div className="flex h-svh flex-col overflow-hidden bg-muted/30">
        <DashboardHeader
          role={role}
          userName={userName}
          title={title}
          description={description}
          actions={actions}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <DashboardSidebar role={role} userName={userName} />

          <main
            id="dashboard-main"
            className="min-w-0 flex-1 overflow-y-auto overscroll-contain"
            tabIndex={-1}
          >
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
          </main>
        </div>
      </div>
    </DashboardLayoutProvider>
  );
}
