import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileText,
  Grid3X3,
  Sparkles,
  Target,
  Upload,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { cn } from "@/lib/utils";

export interface CandidateDashboardStep {
  id: string;
  label: string;
  description: string;
  done: boolean;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CandidateDashboardViewProps {
  userName?: string | null;
  completionPercentage: number;
  status: string;
  statusLabel: string;
  lastUpdated: string;
  isReady: boolean;
  steps: CandidateDashboardStep[];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getStatusStyles(status: string, isReady: boolean) {
  if (isReady) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "submitted") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function CandidateDashboardView({
  userName,
  completionPercentage,
  status,
  statusLabel,
  lastUpdated,
  isReady,
  steps,
}: CandidateDashboardViewProps) {
  const displayName = userName?.split(" ")[0] || "there";
  const completedCount = steps.filter((step) => step.done).length;
  const nextStep = steps.find((step) => !step.done);
  const journeyProgress = Math.round((completedCount / steps.length) * 100);

  const quickActions = [
    {
      title: "Edit profile",
      description: "Update your experience and preferences",
      href: "/candidate/profile",
      icon: User,
      accent: "from-blue-500/10 to-blue-600/5 text-primary",
    },
    {
      title: "Manage CV",
      description: "Upload or replace your résumé",
      href: "/candidate/cv",
      icon: Upload,
      accent: "from-violet-500/10 to-violet-600/5 text-violet-600",
    },
    {
      title: FRAMEWORK_MATCHING_LANGUAGE,
      description: "Complete your matching questionnaire",
      href: "/candidate/matrix",
      icon: Grid3X3,
      accent: "from-indigo-500/10 to-indigo-600/5 text-indigo-600",
    },
    {
      title: "Matching status",
      description: "See readiness and employer interest",
      href: "/candidate/status",
      icon: Target,
      accent: "from-emerald-500/10 to-emerald-600/5 text-emerald-600",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-white to-white p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-3">
            <p className="text-sm font-medium text-primary">
              {getGreeting()}, {displayName}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {isReady
                ? "You're ready to be discovered"
                : "Let's get your profile match-ready"}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {isReady
                ? "Employers can now find you in matching results. When they unlock your profile, they'll reach out directly."
                : "Complete the steps below so we can match you with roles that fit your skills, goals, and work style."}
            </p>
            {!isReady && nextStep && (
              <Button className="mt-2 gap-2 rounded-full px-6" asChild>
                <Link href={nextStep.href}>
                  Continue: {nextStep.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-4 sm:flex-row lg:flex-col xl:flex-row">
            <div className="min-w-[200px] rounded-xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Profile strength
                  </p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                    {completionPercentage}%
                  </p>
                </div>
                <div className="rounded-full bg-primary/10 p-2.5">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              </div>
              <Progress value={completionPercentage} className="mt-4 h-2.5" />
              <p className="mt-2 text-xs text-muted-foreground">
                {completedCount} of {steps.length} onboarding steps done
              </p>
            </div>

            <div className="grid min-w-[200px] grid-cols-2 gap-3 sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1">
              <div className="rounded-xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <Badge
                  className={cn(
                    "mt-2 border font-medium",
                    getStatusStyles(status, isReady)
                  )}
                >
                  {statusLabel}
                </Badge>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <p className="text-xs font-medium text-muted-foreground">Updated</p>
                <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {lastUpdated}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isReady && (
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-white shadow-sm">
          <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-emerald-100 p-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">Profile live for matching</p>
                <p className="mt-1 text-sm text-emerald-800/90">
                  Keep your profile updated to stay competitive. Check matching status anytime.
                </p>
              </div>
            </div>
            <Button variant="outline" className="border-emerald-200 bg-white shrink-0" asChild>
              <Link href="/candidate/status">View status</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Your onboarding journey</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Follow these steps in order for the best match quality.
            </p>
          </div>
          <p className="hidden text-sm font-medium text-muted-foreground sm:block">
            {journeyProgress}% complete
          </p>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const isNext = !step.done && steps.slice(0, index).every((s) => s.done);
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className={cn(
                  "group relative flex flex-col gap-4 rounded-xl border p-5 transition-all sm:flex-row sm:items-center sm:justify-between",
                  step.done
                    ? "border-emerald-100 bg-emerald-50/40"
                    : isNext
                      ? "border-primary/20 bg-white shadow-sm ring-1 ring-primary/10"
                      : "border-slate-200 bg-white"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      step.done
                        ? "bg-emerald-100 text-emerald-700"
                        : isNext
                          ? "bg-primary text-primary-foreground"
                          : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {step.done ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StepIcon
                        className={cn(
                          "h-4 w-4",
                          step.done ? "text-emerald-600" : isNext ? "text-primary" : "text-slate-400"
                        )}
                      />
                      <p className="font-medium text-foreground">{step.label}</p>
                      {step.done && (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700"
                        >
                          Complete
                        </Badge>
                      )}
                      {isNext && (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                          Up next
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>

                <Button
                  variant={step.done ? "outline" : isNext ? "default" : "secondary"}
                  size="sm"
                  className="shrink-0 gap-1.5 self-start sm:self-center"
                  asChild
                >
                  <Link href={step.href}>
                    {step.done ? "Review" : isNext ? "Continue" : "Start"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Quick actions</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Jump straight to the section you need.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {quickActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Link
                key={action.href + action.title}
                href={action.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "rounded-xl bg-gradient-to-br p-3",
                      action.accent
                    )}
                  >
                    <ActionIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground group-hover:text-primary">
                      {action.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">How matching works</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Deep HR Match uses your profile, CV, and {FRAMEWORK_MATCHING_LANGUAGE} answers to
              rank you against employer roles. You stay anonymous until an employer unlocks your
              profile — then they contact you directly outside the platform.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
