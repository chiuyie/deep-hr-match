import { FRAMEWORK, FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { employerNav, isDashboardNavActive } from "@/lib/constants/dashboard-nav";

export interface EmployerPageMeta {
  title: string;
  description?: string;
  contentClassName?: string;
}

const contentClassName = "mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8";
const wideContentClassName = "mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6";

export function getEmployerPageMeta(pathname: string): EmployerPageMeta {
  if (pathname === "/employer") {
    return {
      title: "Employer Dashboard",
      description: "Overview, quick actions, and account metrics",
      contentClassName,
    };
  }

  if (pathname === "/employer/company") {
    return {
      title: "Employer Profile",
      description: "Your organization details",
      contentClassName,
    };
  }

  if (pathname === "/employer/jobs") {
    return {
      title: "Jobs",
      description: "Create and manage job postings (unlimited, free)",
      contentClassName,
    };
  }

  if (pathname === "/employer/jobs/new") {
    return {
      title: "Post a Job",
      description: "Create a new role and start matching",
      contentClassName: wideContentClassName,
    };
  }

  if (pathname === "/employer/unlocked") {
    return {
      title: "Unlocked Candidates",
      description: "All candidate profiles you have unlocked",
      contentClassName,
    };
  }

  if (/\/employer\/jobs\/[^/]+\/view$/.test(pathname)) {
    return {
      title: "View Job",
      description: "Read-only job posting details",
      contentClassName,
    };
  }

  const jobRootMatch = pathname.match(/^\/employer\/jobs\/([^/]+)$/);
  if (jobRootMatch) {
    return {
      title: "Edit Job",
      description: "Update job details and workflow steps",
      contentClassName: wideContentClassName,
    };
  }

  if (/\/employer\/jobs\/[^/]+\/matching$/.test(pathname)) {
    return {
      title: "Matching Results",
      description: "Review ranked candidates and unlock profiles",
      contentClassName,
    };
  }

  if (/\/employer\/jobs\/[^/]+\/jd$/.test(pathname)) {
    return {
      title: "JD Upload",
      description: "Upload job description documents",
      contentClassName,
    };
  }

  if (/\/employer\/jobs\/[^/]+\/matrix$/.test(pathname)) {
    return {
      title: `Job ${FRAMEWORK} Form`,
      description: FRAMEWORK_MATCHING_LANGUAGE,
      contentClassName,
    };
  }

  if (/\/employer\/jobs\/[^/]+\/unlocked$/.test(pathname)) {
    return {
      title: "Unlocked Candidates",
      description: "Full profiles unlocked for this job",
      contentClassName,
    };
  }

  for (const item of employerNav) {
    if (isDashboardNavActive(pathname, item.href)) {
      return {
        title: item.label,
        description: item.description,
        contentClassName,
      };
    }
  }

  return {
    title: "Employer",
    contentClassName,
  };
}
