import {
  Activity,
  Briefcase,
  Building2,
  CreditCard,
  FileText,
  Grid3X3,
  LayoutDashboard,
  ListTree,
  Plus,
  Target,
  Unlock,
  User,
  Users,
} from "lucide-react";
import { FRAMEWORK_MATCHING_LANGUAGE, FRAMEWORK_MATCHING_LANGUAGE_FORM } from "@/lib/constants/branding";
import type { UserRole } from "@/types/database";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

export interface DashboardNavConfig {
  homeHref: string;
  sectionLabel: string;
  items: DashboardNavItem[];
}

const candidateNav: DashboardNavItem[] = [
  {
    href: "/candidate",
    label: "Overview",
    description: "Progress and next steps",
    icon: LayoutDashboard,
  },
  {
    href: "/candidate/profile",
    label: "Profile",
    description: "Personal and professional details",
    icon: User,
  },
  {
    href: "/candidate/cv",
    label: "CV / Résumé",
    description: "Upload and manage your CV",
    icon: FileText,
  },
  {
    href: "/candidate/matrix",
    label: FRAMEWORK_MATCHING_LANGUAGE,
    description: "Complete your matching questionnaire",
    icon: Grid3X3,
  },
  {
    href: "/candidate/status",
    label: "Matching Status",
    description: "Readiness and employer interest",
    icon: Activity,
  },
];

export const employerNav: DashboardNavItem[] = [
  {
    href: "/employer",
    label: "Overview",
    description: "Dashboard and quick actions",
    icon: LayoutDashboard,
  },
  {
    href: "/employer/company",
    label: "Employer Profile",
    description: "Business and contact details",
    icon: Building2,
  },
  {
    href: "/employer/jobs",
    label: "Jobs",
    description: "Manage active postings",
    icon: Briefcase,
  },
  {
    href: "/employer/jobs/new",
    label: "Post a Job",
    description: "Create a new role",
    icon: Plus,
  },
  {
    href: "/employer/unlocked",
    label: "Unlocked Candidates",
    description: "Purchased candidate profiles",
    icon: Users,
  },
];

const adminNav: DashboardNavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    description: "Platform metrics and quick links",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/candidates",
    label: "Candidates",
    description: "Profiles and onboarding progress",
    icon: Users,
  },
  {
    href: "/admin/employers",
    label: "Employers",
    description: "Company accounts and contacts",
    icon: Building2,
  },
  {
    href: "/admin/jobs",
    label: "Jobs",
    description: "All job postings",
    icon: Briefcase,
  },
  {
    href: "/admin/matching",
    label: "Matching",
    description: "Ranked match results",
    icon: Target,
  },
  {
    href: "/admin/matrix",
    label: FRAMEWORK_MATCHING_LANGUAGE_FORM,
    description: "Edit the 7 factor names and word levels",
    icon: Grid3X3,
  },
  {
    href: "/admin/forms",
    label: "Form Fields",
    description: "Profile/job forms and match-result disclosure",
    icon: ListTree,
  },
  {
    href: "/admin/payments",
    label: "Payments",
    description: "Stripe purchase records",
    icon: CreditCard,
  },
  {
    href: "/admin/unlocks",
    label: "Unlocks",
    description: "Profile unlock history",
    icon: Unlock,
  },
  {
    href: "/admin/files",
    label: "Files",
    description: "CV and JD uploads",
    icon: FileText,
  },
];

const navByRole: Record<UserRole, DashboardNavConfig> = {
  candidate: {
    homeHref: "/candidate",
    sectionLabel: "Candidate",
    items: candidateNav,
  },
  employer: {
    homeHref: "/employer",
    sectionLabel: "Employer",
    items: employerNav,
  },
  admin: {
    homeHref: "/admin",
    sectionLabel: "Admin",
    items: adminNav,
  },
};

export function getDashboardNav(role: UserRole): DashboardNavConfig {
  return navByRole[role];
}

export function isDashboardNavActive(pathname: string, href: string) {
  const dashboardRoots = ["/candidate", "/employer", "/admin"];
  if (dashboardRoots.includes(href)) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getRoleLabel(role: UserRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function getUserInitials(name?: string | null) {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}
