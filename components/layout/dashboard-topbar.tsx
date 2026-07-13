"use client";

import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { DashboardNavList } from "@/components/layout/dashboard-nav-list";
import { DashboardUserMenu } from "@/components/layout/dashboard-user-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
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
import { signOut } from "@/lib/auth/actions";
import type { UserRole } from "@/types/database";

interface DashboardTopbarProps {
  role: UserRole;
  userName?: string | null;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function DashboardTopbar({
  role,
  userName,
  title,
  description,
  actions,
}: DashboardTopbarProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const nav = getDashboardNav(role);

  return (
    <header className="sticky top-0 z-30 shrink-0 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 lg:hidden"
                aria-label="Open navigation menu"
                aria-controls="mobile-dashboard-nav"
                aria-expanded={mobileNavOpen}
              />
            }
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

        <BrandLogo href={nav.homeHref} className="shrink-0" />

        <Separator orientation="vertical" className="hidden h-6 sm:block" />

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {title}
          </h1>
          {description && (
            <p className="hidden truncate text-sm text-muted-foreground sm:block">{description}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {actions}
          <ThemeToggle />
          <DashboardUserMenu role={role} userName={userName} />
        </div>
      </div>
      <Separator />
    </header>
  );
}
