import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./brand-logo";
import { LoginMenu } from "./login-menu";
import { ThemeToggle } from "./theme-toggle";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 pt-safe backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-6 lg:px-8">
        <BrandLogo className="min-w-0 [&_span]:truncate" />
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <ThemeToggle />
          <div className="hidden sm:block">
            <LoginMenu />
          </div>
          <Button asChild size="sm" className="rounded-lg px-3 sm:h-9 sm:px-4">
            <Link href="/auth/sign-up">
              <span className="sm:hidden">Join</span>
              <span className="hidden sm:inline">Get Started</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
