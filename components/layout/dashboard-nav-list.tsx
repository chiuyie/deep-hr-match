"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getDashboardNav,
  getRoleLabel,
  getUserInitials,
  isDashboardNavActive,
} from "@/lib/constants/dashboard-nav";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { UserRole } from "@/types/database";

interface DashboardNavListProps {
  role: UserRole;
  userName?: string | null;
  onNavigate?: () => void;
  className?: string;
  showMobileUser?: boolean;
  collapsed?: boolean;
}

export function DashboardNavList({
  role,
  userName,
  onNavigate,
  className,
  showMobileUser = false,
  collapsed = false,
}: DashboardNavListProps) {
  const pathname = usePathname();
  const nav = getDashboardNav(role);

  return (
    <nav className={cn("flex flex-col gap-1", className)} aria-label="Dashboard sections">
      {!collapsed && (
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {nav.sectionLabel}
        </p>
      )}
      <ul className="space-y-1" role="list">
        {nav.items.map((item) => {
          const active = isDashboardNavActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Button
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "relative h-auto w-full whitespace-normal text-left",
                  collapsed ? "justify-center px-0 py-2.5" : "items-start justify-start gap-3 px-3 py-2.5",
                  active && "bg-primary/10 text-primary hover:bg-primary/10"
                )}
                asChild
              >
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  {active && !collapsed && (
                    <span
                      aria-hidden
                      className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-primary"
                    />
                  )}
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {!collapsed && (
                    <span className="min-w-0 flex-1">
                      <span className="block break-words leading-snug">{item.label}</span>
                      {item.description && (
                        <span
                          className={cn(
                            "mt-0.5 block break-words text-xs font-normal leading-snug",
                            active ? "text-primary/80" : "text-muted-foreground"
                          )}
                        >
                          {item.description}
                        </span>
                      )}
                    </span>
                  )}
                  {collapsed && <span className="sr-only">{item.label}</span>}
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>

      {showMobileUser && userName && (
        <Card className="mt-6 border-border bg-muted/40 shadow-none">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="mt-0.5 break-words text-sm font-medium text-foreground">{userName}</p>
            <Badge variant="secondary" className="mt-2">
              {getRoleLabel(role)}
            </Badge>
          </CardContent>
        </Card>
      )}
    </nav>
  );
}

export function DashboardUserBadge({
  userName,
  role,
  className,
  collapsed = false,
}: {
  userName?: string | null;
  role: UserRole;
  className?: string;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <div className={cn("flex justify-center", className)} title={userName || "User"}>
        <Avatar size="sm">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {getUserInitials(userName)}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Avatar size="sm">
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {getUserInitials(userName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="break-words text-sm font-medium leading-snug text-foreground">
          {userName || "User"}
        </p>
        <p className="break-words text-xs leading-snug text-muted-foreground">
          {getRoleLabel(role)} account
        </p>
      </div>
    </div>
  );
}
