"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./brand-logo";
import { signOut } from "@/lib/auth/actions";
import type { UserRole } from "@/types/database";

interface NavLink {
  href: string;
  label: string;
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  links: NavLink[];
  roles: UserRole[];
}

const navSections: NavSection[] = [
  {
    id: "employer",
    title: "EMPLOYER",
    icon: Briefcase,
    roles: ["employer", "admin"],
    links: [
      { href: "/employer", label: "Employer Dashboard" },
      { href: "/employer/jobs", label: "View Distribution Chart" },
      { href: "/employer/jobs", label: "Shortlisted Candidates" },
      { href: "/employer/unlocked", label: "Purchased Candidates" },
      { href: "/employer/company", label: "Request Reference Check" },
      { href: "/employer/unlocked", label: "View Reference Check Result" },
      { href: "/employer/jobs", label: "All Candidates" },
    ],
  },
  {
    id: "candidate",
    title: "CANDIDATE",
    icon: User,
    roles: ["candidate", "admin"],
    links: [
      { href: "/candidate", label: "Candidate Dashboard" },
      { href: "/candidate/status", label: "Jobs Interested In Me" },
      { href: "/candidate/profile", label: "View Similar Employer Industry" },
      { href: "/candidate/profile", label: "View Similar Employer Company Size" },
    ],
  },
  {
    id: "admin",
    title: "ADMIN",
    icon: Shield,
    roles: ["admin"],
    links: [
      { href: "/admin", label: "Admin Dashboard" },
      { href: "/admin/matrix", label: "Level Data" },
      { href: "/admin/candidates", label: "User Access Control" },
      { href: "/admin/employers", label: "All Employers" },
    ],
  },
];

interface DashboardSidebarProps {
  role: UserRole;
  userName?: string | null;
}

export function DashboardSidebar({ role, userName }: DashboardSidebarProps) {
  const pathname = usePathname();
  const visibleSections = navSections.filter((s) => s.roles.includes(role));
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(visibleSections.map((s) => [s.id, true]))
  );

  function toggleSection(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <BrandLogo />
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {visibleSections.map((section) => {
          const isOpen = openSections[section.id];
          return (
            <div key={section.id} className="mb-2">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-xs font-bold tracking-wide text-blue-600"
              >
                <span className="flex items-center gap-2">
                  <section.icon className="h-4 w-4" />
                  {section.title}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {isOpen && (
                <ul className="mt-1 space-y-0.5 pl-2">
                  {section.links.map((link, idx) => {
                    const active =
                      pathname === link.href ||
                      (link.href !== `/${section.id}` &&
                        pathname.startsWith(link.href));
                    return (
                      <li key={`${link.href}-${idx}`}>
                        <Link
                          href={link.href}
                          className={cn(
                            "block rounded-md px-3 py-2 text-sm transition-colors",
                            active
                              ? "bg-blue-50 font-medium text-blue-600"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        {userName && (
          <p className="mb-2 truncate px-2 text-xs text-slate-500">{userName}</p>
        )}
        <form action={signOut}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-slate-600"
            type="submit"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </form>
      </div>
    </aside>
  );
}
