import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./brand-logo";
import { LoginMenu } from "./login-menu";
import { ThemeToggle } from "./theme-toggle";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo />
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <LoginMenu />
          <Button asChild>
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
