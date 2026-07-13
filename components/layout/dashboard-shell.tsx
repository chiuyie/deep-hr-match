import { DashboardChrome } from "./dashboard-chrome";

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
    <DashboardChrome
      role={role}
      userName={userName}
      title={title}
      description={description}
      actions={actions}
    >
      {children}
    </DashboardChrome>
  );
}
