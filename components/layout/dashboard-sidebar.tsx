"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  FileText,
  Grid3X3,
  Building2,
  Briefcase,
  Users,
  CreditCard,
  Unlock,
  Settings,
  LogOut,
  Upload,
  BarChart3,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import type { UserRole } from "@/types/database";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const candidateNav: NavItem[] = [
  { href: "/candidate", label: "Dashboard", icon: LayoutDashboard },
  { href: "/candidate/profile", label: "Profile", icon: User },
  { href: "/candidate/cv", label: "CV Upload", icon: Upload },
  { href: "/candidate/matrix", label: "7×7 Matching Language", icon: Grid3X3 },
  { href: "/candidate/status", label: "Profile Status", icon: BarChart3 },
];

const employerNav: NavItem[] = [
  { href: "/employer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/company", label: "Company Profile", icon: Building2 },
  { href: "/employer/jobs", label: "Jobs", icon: Briefcase },
  { href: "/employer/unlocked", label: "Unlocked Candidates", icon: Unlock },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/matrix", label: "7×7 Form Management", icon: Settings },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
  { href: "/admin/employers", label: "Employers", icon: Building2 },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/matching", label: "Matching Results", icon: BarChart3 },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/unlocks", label: "Unlocks", icon: Unlock },
  { href: "/admin/files", label: "Uploaded Files", icon: FolderOpen },
];

function getNav(role: UserRole): NavItem[] {
  switch (role) {
    case "admin":
      return adminNav;
    case "employer":
      return employerNav;
    default:
      return candidateNav;
  }
}

interface DashboardSidebarProps {
  role: UserRole;
  userName?: string | null;
}

export function DashboardSidebar({ role, userName }: DashboardSidebarProps) {
  const pathname = usePathname();
  const nav = getNav(role);

  return (
    <aside className="flex w-64 flex-col border-r bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1e40af] text-sm font-bold text-white">
          7
        </div>
        <div>
          <p className="text-sm font-semibold">Deep HR Match</p>
          <p className="text-xs capitalize text-muted-foreground">{role}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== `/${role}` && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[#1e40af]/10 text-[#1e40af]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        {userName && (
          <p className="mb-2 truncate px-3 text-xs text-muted-foreground">{userName}</p>
        )}
        <form action={signOut}>
          <Button variant="ghost" className="w-full justify-start gap-3" type="submit">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </form>
      </div>
    </aside>
  );
}
