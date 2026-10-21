import type { ReactNode } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/layout/public-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const authFieldClassName = "h-11 rounded-xl bg-white px-3 text-base md:text-sm dark:bg-slate-950";

export function AuthPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F8FC] dark:bg-slate-950">
      <PublicNav />
      <main className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center sm:py-10">
        <div className="w-full max-w-lg">
          <Card className="border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="space-y-1.5 px-5 pt-5 sm:px-6">
              <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 sm:px-6">{children}</CardContent>
          </Card>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            <Link href="/terms" className="underline-offset-2 hover:underline">
              Terms
            </Link>
            <span aria-hidden className="px-2">
              ·
            </span>
            <Link href="/privacy" className="underline-offset-2 hover:underline">
              Privacy
            </Link>
            <span aria-hidden className="px-2">
              ·
            </span>
            <Link href="/cookies" className="underline-offset-2 hover:underline">
              Cookies
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
