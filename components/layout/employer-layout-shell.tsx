"use client";

import { usePathname } from "next/navigation";
import { DashboardChrome } from "@/components/layout/dashboard-chrome";
import { getEmployerPageMeta } from "@/lib/constants/employer-pages";

interface EmployerLayoutShellProps {
  userName?: string | null;
  children: React.ReactNode;
}

export function EmployerLayoutShell({ userName, children }: EmployerLayoutShellProps) {
  const pathname = usePathname();
  const meta = getEmployerPageMeta(pathname);

  return (
    <DashboardChrome
      role="employer"
      userName={userName}
      title={meta.title}
      description={meta.description}
      contentClassName={meta.contentClassName}
    >
      {children}
    </DashboardChrome>
  );
}
