import Link from "next/link";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { AuthPortalRoleSwitch } from "@/components/auth/auth-portal-role-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signUp } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { toUserFacingMessage } from "@/lib/ui/readable-error";

const errorMessages: Record<string, { title: string; description: string }> = {
  invalid: {
    title: "Check your details",
    description: "Name, a valid email, and a password of at least 8 characters are required.",
  },
  "email-exists": {
    title: "Email already registered",
    description:
      "This email already has an account. Sign in with that account, or use a different email. Each email can only be linked to one account type (employer or candidate).",
  },
  "weak-password": {
    title: "Password not accepted",
    description: "Use at least 8 characters. If the service asks for more, follow the requirement below.",
  },
  "invalid-email": {
    title: "Email not accepted",
    description: "That email address is not valid. Check for typos and try again.",
  },
  "rate-limit": {
    title: "Too many sign-up attempts",
    description:
      "The sign-up service is limiting new accounts from this address. Wait a few minutes, then try again.",
  },
  "email-send-failed": {
    title: "Could not send the confirmation email",
    description:
      "The account may not have been created because the confirmation email failed. Try again shortly, or use a different email address.",
  },
  "signup-disabled": {
    title: "Sign up unavailable",
    description: "New registrations are temporarily disabled. Try again later or contact support.",
  },
  "database-setup": {
    title: "Sign up is not configured yet",
    description:
      "We can’t create accounts right now. Try again later, or contact support if you need help.",
  },
  "setup-failed": {
    title: "Account setup incomplete",
    description:
      "Your account was created but setup did not finish. Try signing in. If that does not work, contact support.",
  },
  "signup-failed": {
    title: "Could not create account",
    description:
      "Sign-up was rejected, but no specific reason was returned. Check the email and password, then try again.",
  },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string; detail?: string }>;
}) {
  const params = await searchParams;
  const portalRole =
    params.role === "employer" || params.role === "candidate" ? params.role : null;
  const defaultRole = portalRole ?? "candidate";
  const supabaseReady = isSupabaseConfigured();
  const error = params.error ? errorMessages[params.error] : null;
  const detail =
    typeof params.detail === "string" && params.detail.trim().length > 0
      ? toUserFacingMessage(params.detail.trim().slice(0, 220), {
          fallback: "Check your details and try again.",
        })
      : null;

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

            <div className="mb-4">
              <AuthPortalRoleSwitch basePath="/auth/sign-up" activeRole={portalRole} />
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>{error.title}</AlertTitle>
                <AlertDescription>
                  {detail ?? error.description}
                  {params.error === "email-exists" && (
                    <>
                      {" "}
                      <Link
                        href={
                          portalRole ? `/auth/sign-in?role=${portalRole}` : "/auth/sign-in"
                        }
                        className="font-medium underline underline-offset-2"
                      >
                        Sign in instead
                      </Link>
                      {portalRole === "employer" && (
                        <>
                          {" "}
                          or{" "}
                          <Link
                            href="/auth/sign-in?role=candidate"
                            className="font-medium underline underline-offset-2"
                          >
                            sign in as Candidate
                          </Link>
                        </>
                      )}
                      .
                    </>
                  )}
                </AlertDescription>
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
                  Sign up
                </Button>
                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  By creating an account you agree to our{" "}
                  <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                    Privacy Policy
                  </Link>
                  .
                </p>
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
            <p className="mt-2 text-center text-xs text-muted-foreground">
              <Link href="/cookies" className="underline underline-offset-2 hover:text-foreground">
                Cookie Policy
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}
