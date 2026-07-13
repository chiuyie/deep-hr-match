"use client";

import { LogOut } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { DashboardNavList, DashboardUserBadge } from "@/components/layout/dashboard-nav-list";
import { useDashboardLayout } from "@/components/layout/dashboard-layout-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getDashboardNav } from "@/lib/constants/dashboard-nav";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

interface DashboardSidebarProps {
  role: UserRole;
  userName?: string | null;
}

export function DashboardSidebar({ role, userName }: DashboardSidebarProps) {
  const { collapsed } = useDashboardLayout();
  const nav = getDashboardNav(role);

  return (
    <aside
      id="dashboard-sidebar"
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 ease-in-out lg:flex",
        collapsed ? "w-[4.5rem]" : "w-64"
      )}
      aria-label="Primary navigation"
      data-collapsed={collapsed}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center",
          collapsed ? "justify-center px-2" : "px-5"
        )}
      >
        <BrandLogo href={nav.homeHref} compact={collapsed} />
      </div>

      <Separator />

      <ScrollArea className="min-h-0 flex-1">
        <div className={cn("py-5", collapsed ? "px-2" : "px-3")}>
          <DashboardNavList role={role} collapsed={collapsed} />
        </div>
      </ScrollArea>

      <Separator />

      <div className={cn("shrink-0 space-y-3", collapsed ? "p-2" : "p-4")}>
        <DashboardUserBadge userName={userName} role={role} collapsed={collapsed} />
        <form action={signOut}>
          <Button
            variant="ghost"
            className={cn(
              "h-10 text-muted-foreground hover:text-foreground",
              collapsed ? "w-10 justify-center px-0" : "w-full justify-start gap-2"
            )}
            type="submit"
            title="Sign out"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </Button>
        </form>
      </div>
    </aside>
  );
}
