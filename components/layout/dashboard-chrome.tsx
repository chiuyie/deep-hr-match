"use client";

import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";
import { PublicFooter } from "./public-footer";
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
      <div className="flex min-h-svh flex-col bg-muted/30">
        <div className="flex min-h-0 flex-1">
          <DashboardSidebar role={role} userName={userName} />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <DashboardTopbar
              role={role}
              userName={userName}
              title={title}
              description={description}
              actions={actions}
            />

            <main
              id="dashboard-main"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
              tabIndex={-1}
            >
              <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
            </main>
          </div>
        </div>

        <PublicFooter />
      </div>
    </DashboardLayoutProvider>
  );
}
