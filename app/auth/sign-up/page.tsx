import Link from "next/link";
import { AuthPageShell, authFieldClassName } from "@/components/auth/auth-page-shell";
import { PasswordField } from "@/components/auth/password-field";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { AuthPortalRoleSwitch } from "@/components/auth/auth-portal-role-switch";
import { Button } from "@/components/ui/button";
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
  const roleLabel = portalRole === "employer" ? "employer" : "candidate";
  const supabaseReady = isSupabaseConfigured();
  const error = params.error ? errorMessages[params.error] : null;
  const detail =
    typeof params.detail === "string" && params.detail.trim().length > 0
      ? toUserFacingMessage(params.detail.trim().slice(0, 220), {
          fallback: "Check your details and try again.",
        })
      : null;

  const title = portalRole
    ? `Create your ${roleLabel} account`
    : "Create an account";
  const description = portalRole
    ? portalRole === "employer"
      ? "Post roles and see candidates who already match your filters."
      : "Build your profile and get matched to roles that fit."
    : "Choose candidate or employer. Each email can only belong to one account type.";

  return (
    <AuthPageShell title={title} description={description}>
      {!supabaseReady && <SupabaseSetupNotice />}

      <AuthPortalRoleSwitch basePath="/auth/sign-up" activeRole={portalRole} />

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>
            {detail ?? error.description}
            {params.error === "email-exists" && (
              <>
                {" "}
                <Link
                  href={portalRole ? `/auth/sign-in?role=${portalRole}` : "/auth/sign-in"}
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

      {!portalRole ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          <form action={signUp} className="space-y-3">
            <fieldset disabled={!supabaseReady} className="space-y-3">
              <input type="hidden" name="portalRole" value={portalRole} />
              <input type="hidden" name="role" value={portalRole} />
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  className={authFieldClassName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={authFieldClassName}
                />
              </div>
              <PasswordField
                autoComplete="new-password"
                minLength={8}
                hint="At least 8 characters."
              />
              <Button type="submit" className="h-11 w-full rounded-xl text-base">
                Create {roleLabel} account
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
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={`/auth/sign-in?role=${portalRole}`}
              className="text-primary hover:underline dark:text-primary/80"
            >
              Sign in as {roleLabel}
            </Link>
          </p>
        </div>
      )}
    </AuthPageShell>
  );
}
