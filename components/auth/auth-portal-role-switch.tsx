import Link from "next/link";
import { Briefcase, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuthPortalRole = "candidate" | "employer";

const portals: {
  role: AuthPortalRole;
  label: string;
  description: string;
  icon: typeof UserRound;
}[] = [
  {
    role: "candidate",
    label: "Candidate",
    description: "Find roles and complete your matching profile",
    icon: UserRound,
  },
  {
    role: "employer",
    label: "Employer",
    description: "Post jobs, run matching, and unlock candidates",
    icon: Briefcase,
  },
];

function buildAuthHref(
  basePath: "/auth/sign-in" | "/auth/sign-up",
  role: AuthPortalRole,
  preserve?: { error?: string }
) {
  const params = new URLSearchParams();
  params.set("role", role);
  if (preserve?.error && preserve.error !== "wrong-role") {
    params.set("error", preserve.error);
  }
  return `${basePath}?${params.toString()}`;
}

export function AuthPortalRoleSwitch({
  basePath,
  activeRole,
  preserveQuery,
}: {
  basePath: "/auth/sign-in" | "/auth/sign-up";
  activeRole: AuthPortalRole | null;
  preserveQuery?: { error?: string };
}) {
  const verb = basePath === "/auth/sign-in" ? "sign in" : "sign up";

  if (!activeRole) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
          Choose how you use Deep HR Match
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {portals.map(({ role, label, description, icon: Icon }) => (
            <Link
              key={role}
              href={buildAuthHref(basePath, role, preserveQuery)}
              className="group flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-primary/50"
            >
              <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primary shadow-sm ring-1 ring-slate-200 group-hover:ring-primary/30 dark:bg-slate-900 dark:ring-slate-600">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-50">{label}</span>
              <span className="mt-1 text-xs leading-snug text-muted-foreground">{description}</span>
              <span className="mt-3 text-xs font-medium text-primary">
                Continue to {verb} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="mb-1 grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-700 dark:bg-slate-800/80"
      role="tablist"
      aria-label="Account type"
    >
      {portals.map(({ role, label, icon: Icon }) => {
        const selected = activeRole === role;
        return (
          <Link
            key={role}
            href={buildAuthHref(basePath, role, preserveQuery)}
            role="tab"
            aria-selected={selected}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              selected
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-50"
                : "text-muted-foreground hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
