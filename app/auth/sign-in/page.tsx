import Link from "next/link";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const roleLabel =
    params.role === "employer" ? "Employer" : params.role === "candidate" ? "Candidate" : "";
  const supabaseReady = isSupabaseConfigured();
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <PublicNav />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>
              {roleLabel ? `Log In as ${roleLabel}` : "Log In"}
            </CardTitle>
            <CardDescription>
              Access your Deep HR Match account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!supabaseReady && <SupabaseSetupNotice />}
            <form action={signIn} className="space-y-4">
              <fieldset disabled={!supabaseReady} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-lg"
              >
                Log In
              </Button>
              </fieldset>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link
                href={`/auth/sign-up${params.role ? `?role=${params.role}` : ""}`}
                className="text-primary hover:underline dark:text-primary/80"
              >
                Get Started
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Platform admin?{" "}
              <Link
                href="/auth/admin/sign-in"
                className="text-primary hover:underline dark:text-primary/80"
              >
                Admin sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}
