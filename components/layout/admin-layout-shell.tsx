"use client";

import { usePathname } from "next/navigation";
import { DashboardChrome } from "@/components/layout/dashboard-chrome";
import { getAdminPageMeta } from "@/lib/constants/admin-pages";

interface AdminLayoutShellProps {
  userName?: string | null;
  children: React.ReactNode;
}

export function AdminLayoutShell({ userName, children }: AdminLayoutShellProps) {
  const pathname = usePathname();
  const meta = getAdminPageMeta(pathname);

  return (
    <DashboardChrome
      role="admin"
      userName={userName}
      title={meta.title}
      description={meta.description}
      contentClassName={meta.contentClassName}
    >
      {children}
    </DashboardChrome>
  );
}
