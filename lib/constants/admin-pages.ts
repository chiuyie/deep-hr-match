import { FRAMEWORK_MATCHING_LANGUAGE_FORM_EDITOR } from "@/lib/constants/branding";
import { isDashboardNavActive } from "@/lib/constants/dashboard-nav";

export interface AdminPageMeta {
  title: string;
  description?: string;
  contentClassName?: string;
}

const contentClassName = "mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8";
const wideContentClassName = "mx-auto w-full max-w-[96rem] px-4 py-4 sm:px-6 sm:py-6";

export function getAdminPageMeta(pathname: string): AdminPageMeta {
  if (pathname === "/admin") {
    return {
      title: "Admin Dashboard",
      description: "Platform overview and administrative tools",
      contentClassName,
    };
  }

  if (pathname === "/admin/candidates") {
    return {
      title: "Candidates",
      description: "All candidate profiles and onboarding progress",
      contentClassName,
    };
  }

  if (pathname.startsWith("/admin/candidates/")) {
    return {
      title: "Candidate details",
      description: "Read-only candidate profile",
      contentClassName,
    };
  }

  if (pathname === "/admin/employers") {
    return {
      title: "Employers",
      description: "Company profiles and contact details",
      contentClassName,
    };
  }

  if (pathname.startsWith("/admin/employers/")) {
    return {
      title: "Employer details",
      description: "Read-only employer profile",
      contentClassName,
    };
  }

  if (pathname === "/admin/jobs") {
    return {
      title: "Jobs",
      description: "Job listings across all employers",
      contentClassName,
    };
  }

  if (pathname.startsWith("/admin/jobs/")) {
    return {
      title: "Job details",
      description: "Read-only job posting",
      contentClassName,
    };
  }

  if (pathname === "/admin/matching") {
    return {
      title: "Matching Results",
      description: "Ranked candidate scores per job",
      contentClassName,
    };
  }

  if (pathname === "/admin/matrix") {
    return {
      title: FRAMEWORK_MATCHING_LANGUAGE_FORM_EDITOR,
      contentClassName: wideContentClassName,
    };
  }

  if (pathname === "/admin/forms") {
    return {
      title: "Form Fields",
      description:
        "Edit candidate profile, employer profile, and create-job form fields — plus what employers can see on match rankings and unlocked reports",
      contentClassName: wideContentClassName,
    };
  }

  if (pathname === "/admin/payments") {
    return {
      title: "Payments",
      description: "Stripe checkout and unlock purchases",
      contentClassName,
    };
  }

  if (pathname === "/admin/unlocks") {
    return {
      title: "Unlocks",
      description: "Candidate profiles unlocked by employers",
      contentClassName,
    };
  }

  if (pathname === "/admin/files") {
    return {
      title: "Uploaded Files",
      description: "CV and job description documents",
      contentClassName,
    };
  }

  return { title: "Admin", contentClassName };
}

export function isAdminNavActive(pathname: string, href: string) {
  return isDashboardNavActive(pathname, href);
}
