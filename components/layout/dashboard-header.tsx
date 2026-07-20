"use client";

import { useState } from "react";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { DashboardNavList } from "@/components/layout/dashboard-nav-list";
import { DashboardUserMenu } from "@/components/layout/dashboard-user-menu";
import { useDashboardLayout } from "@/components/layout/dashboard-layout-context";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getDashboardNav } from "@/lib/constants/dashboard-nav";
import { getDashboardSidebarWidthClass } from "@/lib/constants/dashboard-layout";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

interface DashboardHeaderProps {
  role: UserRole;
  userName?: string | null;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function DashboardHeader({
  role,
  userName,
  title,
  description,
  actions,
}: DashboardHeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { collapsed, toggleCollapsed } = useDashboardLayout();
  const nav = getDashboardNav(role);
  const sidebarWidthClass = getDashboardSidebarWidthClass(collapsed);

  return (
    <header className="z-30 flex h-14 shrink-0 items-stretch border-b border-border bg-background">
      <div
        className={cn(
          "flex shrink-0 items-center px-2 sm:px-3 lg:border-r lg:border-border lg:transition-[width] lg:duration-200 lg:ease-in-out",
          sidebarWidthClass,
          collapsed ? "lg:justify-center" : "lg:gap-2"
        )}
      >
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            nativeButton
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "size-10 shrink-0 lg:hidden"
            )}
            aria-label="Open navigation menu"
            aria-controls="mobile-dashboard-nav"
            aria-expanded={mobileNavOpen}
          >
            <Menu className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="left" className="flex w-[min(100vw-2rem,18rem)] flex-col p-0">
            <SheetHeader className="shrink-0 px-4 py-4 text-left">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <BrandLogo href={nav.homeHref} />
            </SheetHeader>
            <Separator />
            <ScrollArea className="min-h-0 flex-1">
              <div id="mobile-dashboard-nav" className="px-3 py-4">
                <DashboardNavList
                  role={role}
                  userName={userName}
                  showMobileUser
                  onNavigate={() => setMobileNavOpen(false)}
                />
              </div>
            </ScrollArea>
            <Separator />
            <div className="shrink-0 p-4">
              <form action={signOut}>
                <Button
                  variant="ghost"
                  className="h-10 w-full justify-start gap-2 text-muted-foreground"
                  type="submit"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>

        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "hidden size-10 shrink-0 lg:inline-flex"
          )}
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          aria-controls="dashboard-sidebar"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>

        {!collapsed && (
          <BrandLogo href={nav.homeHref} className="hidden min-w-0 flex-1 lg:flex" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3 px-4 sm:px-6">
        <BrandLogo href={nav.homeHref} className="shrink-0 lg:hidden" />

        <div className="min-w-0 flex-1 overflow-hidden">
          <h1
            className="truncate text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg"
            title={title}
          >
            {title}
          </h1>
          {description && (
            <p
              className="hidden truncate text-sm leading-snug text-muted-foreground sm:block"
              title={description}
            >
              {description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {actions}
          <ThemeToggle />
          <DashboardUserMenu role={role} userName={userName} />
        </div>
      </div>
    </header>
  );
}
