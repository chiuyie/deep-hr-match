import Link from "next/link";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signUp } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const errorMessages: Record<string, { title: string; description: string }> = {
  invalid: {
    title: "Sign up failed",
    description: "Check your details and try again.",
  },
  "signup-failed": {
    title: "Could not create account",
    description: "That email may already be registered, or the password did not meet requirements.",
  },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string }>;
}) {
  const params = await searchParams;
  const portalRole =
    params.role === "employer" || params.role === "candidate" ? params.role : null;
  const defaultRole = portalRole ?? "candidate";
  const supabaseReady = isSupabaseConfigured();
  const error = params.error ? errorMessages[params.error] : null;

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <PublicNav />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>
              {portalRole === "employer"
                ? "Create Employer Account"
                : portalRole === "candidate"
                  ? "Create Candidate Account"
                  : "Get Started"}
            </CardTitle>
            <CardDescription>Join Deep HR Match and find your perfect fit</CardDescription>
          </CardHeader>
          <CardContent>
            {!supabaseReady && <SupabaseSetupNotice />}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>{error.title}</AlertTitle>
                <AlertDescription>{error.description}</AlertDescription>
              </Alert>
            )}

            <form action={signUp} className="space-y-4">
              <fieldset disabled={!supabaseReady} className="space-y-4">
                {portalRole && (
                  <>
                    <input type="hidden" name="portalRole" value={portalRole} />
                    <input type="hidden" name="role" value={portalRole} />
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" minLength={8} required />
                </div>
                {!portalRole && (
                  <div className="space-y-2">
                    <Label htmlFor="role">I am a</Label>
                    <select
                      id="role"
                      name="role"
                      defaultValue={defaultRole}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="candidate">Candidate</option>
                      <option value="employer">Employer</option>
                    </select>
                  </div>
                )}
                <Button type="submit" className="w-full rounded-lg">
                  Get Started
                </Button>
              </fieldset>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={
                  portalRole ? `/auth/sign-in?role=${portalRole}` : "/auth/sign-in"
                }
                className="text-primary hover:underline dark:text-primary/80"
              >
                Log In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}
