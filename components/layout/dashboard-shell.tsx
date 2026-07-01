import { DashboardSidebar } from "./dashboard-sidebar";
import { PublicFooter } from "./public-footer";
import { BrandLogo } from "./brand-logo";

import type { UserRole } from "@/types/database";

interface DashboardShellProps {
  role: UserRole;
  userName?: string | null;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function DashboardShell({
  role,
  userName,
  title,
  description,
  children,
  actions,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex flex-1">
        <DashboardSidebar role={role} userName={userName} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 sm:hidden">
                  <BrandLogo />
                </div>
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {title}
                </h1>
                {description && (
                  <p className="mt-1 text-sm text-slate-500">{description}</p>
                )}
                {userName && (
                  <p className="mt-1 text-sm text-slate-500">
                    Logged in as:{" "}
                    <span className="font-medium text-slate-700">{userName}</span>
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex flex-wrap items-center gap-2">{actions}</div>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
