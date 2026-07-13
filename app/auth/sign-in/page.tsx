import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { WrongRoleSignInNotice } from "@/components/auth/wrong-role-sign-in-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signIn } from "@/lib/auth/actions";
import { getCurrentUser, getDashboardPath } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const errorMessages: Record<string, { title: string; description: string }> = {
  "use-admin-portal": {
    title: "Admin account",
    description: "Platform admin accounts must sign in through the admin portal.",
  },
  "confirm-email": {
    title: "Confirm your email",
    description:
      "Your account was created. Check your inbox for a confirmation link, then sign in here.",
  },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string; account?: string }>;
}) {
  const params = await searchParams;
  const portalRole =
    params.role === "employer" || params.role === "candidate" ? params.role : null;
  const accountRole =
    params.account === "employer" || params.account === "candidate" ? params.account : null;
  const accountLabel =
    accountRole === "employer" ? "Employer" : accountRole === "candidate" ? "Candidate" : null;
  const roleLabel =
    portalRole === "employer" ? "Employer" : portalRole === "candidate" ? "Candidate" : "";
  const supabaseReady = isSupabaseConfigured();
  const showWrongRoleNotice = params.error === "wrong-role" && accountRole;
  const showInvalidCredentials = params.error === "invalid";
  const error =
    params.error && params.error !== "wrong-role" && params.error !== "invalid"
      ? errorMessages[params.error]
      : null;

  if (!showWrongRoleNotice) {
    const user = await getCurrentUser();
    if (user) {
      if (user.role === "admin") {
        redirect("/auth/admin/sign-in?error=use-admin-portal");
      }
      if (!portalRole || user.role === portalRole) {
        redirect(getDashboardPath(user.role));
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <PublicNav />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            {showWrongRoleNotice && accountLabel ? (
              <>
                <CardTitle>Continue as {accountLabel}</CardTitle>
                <CardDescription>
                  Your login details are correct. This email is registered as a {accountLabel}{" "}
                  account.
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle>{roleLabel ? `Log In as ${roleLabel}` : "Log In"}</CardTitle>
                <CardDescription>Access your Deep HR Match account</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {!supabaseReady && <SupabaseSetupNotice />}

            {showWrongRoleNotice ? (
              <WrongRoleSignInNotice triedRole={portalRole} accountRole={accountRole} />
            ) : (
              <>
                {error && (
                  <Alert
                    variant={params.error === "confirm-email" ? "default" : "destructive"}
                    className="mb-4"
                  >
                    <AlertTitle>{error.title}</AlertTitle>
                    <AlertDescription>
                      {error.description}
                      {params.error === "use-admin-portal" && (
                        <>
                          {" "}
                          <Link href="/auth/admin/sign-in" className="font-medium underline">
                            Go to admin sign in
                          </Link>
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <form action={signIn} className="space-y-4">
                  <fieldset disabled={!supabaseReady} className="space-y-4">
                    {portalRole && <input type="hidden" name="role" value={portalRole} />}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        aria-invalid={showInvalidCredentials}
                        aria-describedby={showInvalidCredentials ? "sign-in-error" : undefined}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        aria-invalid={showInvalidCredentials}
                        aria-describedby={showInvalidCredentials ? "sign-in-error" : undefined}
                      />
                      {showInvalidCredentials && (
                        <p id="sign-in-error" className="text-sm text-destructive">
                          Email or password doesn&apos;t match. Try again.
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full rounded-lg">
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}
