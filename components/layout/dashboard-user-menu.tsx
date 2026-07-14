"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DashboardUserBadge } from "@/components/layout/dashboard-nav-list";
import { getDashboardNav } from "@/lib/constants/dashboard-nav";
import { signOut } from "@/lib/auth/actions";
import type { UserRole } from "@/types/database";

interface DashboardUserMenuProps {
  role: UserRole;
  userName?: string | null;
}

export function DashboardUserMenu({ role, userName }: DashboardUserMenuProps) {
  const homeHref = getDashboardNav(role).homeHref;
  const profileHref =
    role === "candidate"
      ? "/candidate/profile"
      : role === "employer"
        ? "/employer/company"
        : "/admin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton
        render={
          <Button
            variant="ghost"
            className="h-auto gap-2 rounded-full px-1.5 py-1.5 hover:bg-muted"
            aria-label="Open account menu"
          />
        }
      >
        <DashboardUserBadge userName={userName} role={role} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{userName || "Account"}</p>
              <p className="text-xs text-muted-foreground capitalize">{role} account</p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={homeHref} />}>
          <User className="h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={profileHref} />}>
          <User className="h-4 w-4" />
          {role === "candidate"
            ? "My profile"
            : role === "employer"
              ? "Employer profile"
              : "Admin home"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
