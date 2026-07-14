import { FRAMEWORK, FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { employerNav, isDashboardNavActive } from "@/lib/constants/dashboard-nav";

export interface EmployerPageMeta {
  title: string;
  description?: string;
  contentClassName?: string;
}

const defaultContentClassName = "mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8";
const wideContentClassName = "mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6";

export function getEmployerPageMeta(pathname: string): EmployerPageMeta {
  if (pathname === "/employer") {
    return {
      title: "Employer Dashboard",
      contentClassName: defaultContentClassName,
    };
  }

  if (pathname === "/employer/company") {
    return {
      title: "Employer Profile",
      description: "Your organization details",
      contentClassName: defaultContentClassName,
    };
  }

  if (pathname === "/employer/jobs") {
    return {
      title: "Jobs",
      description: "Create and manage job postings (unlimited, free)",
      contentClassName: defaultContentClassName,
    };
  }

  if (pathname === "/employer/jobs/new") {
    return {
      title: "Post a Job",
      description: "Create a new role",
      contentClassName: wideContentClassName,
    };
  }

  if (pathname === "/employer/unlocked") {
    return {
      title: "Unlocked Candidates",
      description: "All candidate profiles you have unlocked",
      contentClassName: defaultContentClassName,
    };
  }

  const jobRootMatch = pathname.match(/^\/employer\/jobs\/([^/]+)$/);
  if (jobRootMatch) {
    return {
      title: "Edit Job",
      contentClassName: wideContentClassName,
    };
  }

  if (/\/employer\/jobs\/[^/]+\/matching$/.test(pathname)) {
    return {
      title: "Matching Results",
      contentClassName: defaultContentClassName,
    };
  }

  if (/\/employer\/jobs\/[^/]+\/jd$/.test(pathname)) {
    return {
      title: "JD Upload",
      contentClassName: defaultContentClassName,
    };
  }

  if (/\/employer\/jobs\/[^/]+\/matrix$/.test(pathname)) {
    return {
      title: `Job ${FRAMEWORK} Form`,
      description: FRAMEWORK_MATCHING_LANGUAGE,
      contentClassName: defaultContentClassName,
    };
  }

  if (/\/employer\/jobs\/[^/]+\/unlocked$/.test(pathname)) {
    return {
      title: "Unlocked Candidates",
      contentClassName: defaultContentClassName,
    };
  }

  for (const item of employerNav) {
    if (isDashboardNavActive(pathname, item.href)) {
      return {
        title: item.label,
        description: item.description,
        contentClassName: defaultContentClassName,
      };
    }
  }

  return {
    title: "Employer",
    contentClassName: defaultContentClassName,
  };
}
