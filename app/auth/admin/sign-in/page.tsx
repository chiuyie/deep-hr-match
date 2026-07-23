import { Shield } from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signInAsAdmin, signOutToPortalSignIn } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const errorMessages: Record<string, { title: string; description: string }> = {
  invalid: {
    title: "Sign in failed",
    description: "Check your email and password and try again.",
  },
  "not-admin": {
    title: "Admin access required",
    description:
      "This account does not have admin privileges. Use candidate or employer login instead, or ask an existing admin to promote your account.",
  },
  "use-admin-portal": {
    title: "Use this admin portal",
    description:
      "That email belongs to a platform admin account. Sign in here, or switch to candidate / employer login with a different account.",
  },
};

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabaseReady = isSupabaseConfigured();
  const error = params.error ? errorMessages[params.error] : null;

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <PublicNav />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Admin Sign In</CardTitle>
            <CardDescription>
              Platform administration for Deep HR Match
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!supabaseReady && <SupabaseSetupNotice />}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>{error.title}</AlertTitle>
                <AlertDescription>{error.description}</AlertDescription>
              </Alert>
            )}

            <form action={signInAsAdmin} className="space-y-4">
              <fieldset disabled={!supabaseReady} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Admin email</Label>
                  <Input id="email" name="email" type="email" required autoComplete="username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full rounded-lg">
                  Sign in to Admin
                </Button>
              </fieldset>
            </form>

            <form
              action={signOutToPortalSignIn}
              className="mt-4 text-center text-sm text-muted-foreground"
            >
              <span>Not an admin? </span>
              <button
                type="submit"
                className="text-primary hover:underline dark:text-primary/80"
              >
                Candidate or employer login
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}
