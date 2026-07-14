"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoginMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        onClick={() => setOpen((v) => !v)}
      >
        Log In
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <Link
              href="/auth/sign-in?role=employer"
              className="block cursor-pointer px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              Login as Employer
            </Link>
            <Link
              href="/auth/sign-in?role=candidate"
              className={cn(
                "block cursor-pointer border-t border-slate-200 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              )}
              onClick={() => setOpen(false)}
            >
              Login as Candidate
            </Link>
            <Link
              href="/auth/admin/sign-in"
              className="block cursor-pointer border-t border-slate-200 px-4 py-3 text-sm text-muted-foreground hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              Admin Portal
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
