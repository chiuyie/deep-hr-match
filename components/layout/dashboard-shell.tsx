import { DashboardSidebar } from "./dashboard-sidebar";
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
    <div className="flex min-h-screen">
      <DashboardSidebar role={role} userName={userName} />
      <div className="flex flex-1 flex-col">
        <header className="border-b bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
