"use client";

import { LogOut } from "lucide-react";
import { DashboardNavList, DashboardUserBadge } from "@/components/layout/dashboard-nav-list";
import { useDashboardLayout } from "@/components/layout/dashboard-layout-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getDashboardSidebarWidthClass } from "@/lib/constants/dashboard-layout";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

interface DashboardSidebarProps {
  role: UserRole;
  userName?: string | null;
}

export function DashboardSidebar({ role, userName }: DashboardSidebarProps) {
  const { collapsed } = useDashboardLayout();

  return (
    <aside
      id="dashboard-sidebar"
      className={cn(
        "hidden h-full shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 ease-in-out lg:flex",
        getDashboardSidebarWidthClass(collapsed)
      )}
      aria-label="Primary navigation"
      data-collapsed={collapsed}
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className={cn("py-4", collapsed ? "px-2" : "px-3")}>
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
