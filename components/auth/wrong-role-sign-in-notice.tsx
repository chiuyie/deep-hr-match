import Link from "next/link";
import { Briefcase, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutToPortalSignIn } from "@/lib/auth/actions";

type PortalRole = "employer" | "candidate";

const roleMeta: Record<
  PortalRole,
  { label: string; dashboard: string; dashboardHref: string; icon: typeof UserRound }
> = {
  candidate: {
    label: "Candidate",
    dashboard: "Candidate Dashboard",
    dashboardHref: "/candidate",
    icon: UserRound,
  },
  employer: {
    label: "Employer",
    dashboard: "Employer Dashboard",
    dashboardHref: "/employer",
    icon: Briefcase,
  },
};

interface WrongRoleSignInNoticeProps {
  triedRole: PortalRole | null;
  accountRole: PortalRole;
}

export function WrongRoleSignInNotice({
  triedRole,
  accountRole,
}: WrongRoleSignInNoticeProps) {
  const account = roleMeta[accountRole];
  const AccountIcon = account.icon;
  const portalLabel = triedRole ? roleMeta[triedRole].label : "General";

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <AccountIcon className="h-5 w-5" aria-hidden />
        </div>
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          Continue to your {account.dashboard}
        </h3>
      </div>

      <div className="overflow-hidden rounded-lg border border-blue-200/80 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/25">
        <dl className="divide-y divide-blue-200/60 text-sm dark:divide-blue-900/50">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-muted-foreground">Registered Account</dt>
            <dd className="font-medium text-foreground">{account.label}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-muted-foreground">Current Portal</dt>
            <dd className="font-medium text-foreground">{portalLabel}</dd>
          </div>
        </dl>
      </div>

      <Button className="w-full" size="lg" asChild>
        <Link href={account.dashboardHref}>Continue to {account.dashboard}</Link>
      </Button>

      <form action={signOutToPortalSignIn} className="text-center">
        {triedRole && <input type="hidden" name="role" value={triedRole} />}
        <button
          type="submit"
          className="text-sm font-medium text-primary hover:underline"
        >
          Sign in with a different email
        </button>
      </form>
    </div>
  );
}
