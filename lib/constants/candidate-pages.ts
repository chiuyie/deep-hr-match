import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { getDashboardNav, isDashboardNavActive } from "@/lib/constants/dashboard-nav";

export interface CandidatePageMeta {
  title: string;
  description?: string;
}

const contentClassName = "mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8";

export function getCandidatePageMeta(pathname: string): CandidatePageMeta & {
  contentClassName: string;
} {
  if (pathname === "/candidate") {
    return {
      title: "Dashboard",
      description: "Track your progress and get match-ready",
      contentClassName,
    };
  }

  if (pathname === "/candidate/profile") {
    return {
      title: "Profile",
      description: "Build your match-ready profile, one page at a time",
      contentClassName,
    };
  }

  if (pathname === "/candidate/cv") {
    return {
      title: "CV / Résumé",
      description: "Upload, replace, or download the CV employers receive after unlock",
      contentClassName,
    };
  }

  if (pathname === "/candidate/matrix") {
    return {
      title: FRAMEWORK_MATCHING_LANGUAGE,
      description: "Choose one best-fit word at each step to build your profile.",
      contentClassName,
    };
  }

  if (pathname === "/candidate/status") {
    return {
      title: "Matching status",
      description: "Check what’s done, then go live when you’re ready",
      contentClassName,
    };
  }

  for (const item of getDashboardNav("candidate").items) {
    if (isDashboardNavActive(pathname, item.href)) {
      return {
        title: item.label,
        description: item.description,
        contentClassName,
      };
    }
  }

  return {
    title: "Candidate",
    contentClassName,
  };
}
