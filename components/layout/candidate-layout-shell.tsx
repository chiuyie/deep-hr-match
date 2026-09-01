"use client";

import { usePathname } from "next/navigation";
import { DashboardChrome } from "@/components/layout/dashboard-chrome";
import { getCandidatePageMeta } from "@/lib/constants/candidate-pages";

interface CandidateLayoutShellProps {
  userName?: string | null;
  children: React.ReactNode;
}

export function CandidateLayoutShell({ userName, children }: CandidateLayoutShellProps) {
  const pathname = usePathname();
  const meta = getCandidatePageMeta(pathname);

  return (
    <DashboardChrome
      role="candidate"
      userName={userName}
      title={meta.title}
      description={meta.description}
      contentClassName={meta.contentClassName}
    >
      {children}
    </DashboardChrome>
  );
}
