import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPageShell, authFieldClassName } from "@/components/auth/auth-page-shell";
import { PasswordField } from "@/components/auth/password-field";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { WrongRoleSignInNotice } from "@/components/auth/wrong-role-sign-in-notice";
import { AuthPortalRoleSwitch } from "@/components/auth/auth-portal-role-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signIn, signOutToPortalSignIn } from "@/lib/auth/actions";
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

  let signedInAdmin = false;
  if (!showWrongRoleNotice) {
    const user = await getCurrentUser();
    if (user) {
      if (user.role === "admin") {
        // Stay on this page so admins can switch to candidate/employer sign-in
        // instead of bouncing back to the admin portal in a loop.
        signedInAdmin = true;
      } else if (!portalRole || user.role === portalRole) {
        redirect(getDashboardPath(user.role));
      }
    }
  }

  const title =
    showWrongRoleNotice && accountLabel
      ? `Continue as ${accountLabel}`
      : signedInAdmin
        ? "Switch account type"
        : roleLabel
          ? `Sign in as ${roleLabel}`
          : "Sign in";
  const description =
    showWrongRoleNotice && accountLabel
      ? `Your sign-in details are correct. This email is registered as a ${accountLabel} account.`
      : signedInAdmin
        ? "You’re signed in as a platform admin. Continue there, or sign out to use a candidate or employer account."
        : portalRole
          ? `Use the email and password for your ${roleLabel.toLowerCase()} account.`
          : "Choose candidate or employer. Each email belongs to one account type.";

  return (
    <AuthPageShell title={title} description={description}>
            {!supabaseReady && <SupabaseSetupNotice />}

            {showWrongRoleNotice ? (
              <WrongRoleSignInNotice triedRole={portalRole} accountRole={accountRole} />
            ) : signedInAdmin ? (
              <div className="space-y-4">
                <Button className="h-11 w-full rounded-xl text-base" asChild>
                  <Link href="/admin">Go to admin dashboard</Link>
                </Button>
                <form action={signOutToPortalSignIn} className="space-y-3">
                  {portalRole ? <input type="hidden" name="role" value={portalRole} /> : null}
                  <Button type="submit" variant="outline" className="h-11 w-full rounded-xl">
                    Sign out and use another account
                  </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground">
                  Or open{" "}
                  <Link href="/auth/admin/sign-in" className="text-primary hover:underline">
                    admin sign in
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <AuthPortalRoleSwitch
                  basePath="/auth/sign-in"
                  activeRole={portalRole}
                  preserveQuery={params.error ? { error: params.error } : undefined}
                />

                {!portalRole ? (
                  <div className="mt-5 space-y-2 text-center text-sm text-muted-foreground">
                    <p>
                      New here?{" "}
                      <Link href="/auth/sign-up" className="text-primary hover:underline">
                        Create an account
                      </Link>
                    </p>
                    <p>
                      Platform admin?{" "}
                      <Link href="/auth/admin/sign-in" className="text-primary hover:underline">
                        Admin sign in
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
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
                            autoComplete="email"
                            required
                            aria-invalid={showInvalidCredentials}
                            aria-describedby={showInvalidCredentials ? "sign-in-error" : undefined}
                            className={authFieldClassName}
                          />
                        </div>
                        <PasswordField
                          autoComplete="current-password"
                          invalid={showInvalidCredentials}
                          describedBy="sign-in-error"
                          error={
                            showInvalidCredentials
                              ? "Email or password doesn't match. Try again."
                              : undefined
                          }
                        />
                        <Button type="submit" className="h-11 w-full rounded-xl text-base">
                          Sign in as {roleLabel}
                        </Button>
                      </fieldset>
                    </form>

                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      No account?{" "}
                      <Link
                        href={`/auth/sign-up?role=${portalRole}`}
                        className="text-primary hover:underline dark:text-primary/80"
                      >
                        Get started as {roleLabel}
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
                  </div>
                )}
              </>
            )}
    </AuthPageShell>
  );
}
