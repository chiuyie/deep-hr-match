import Link from "next/link";
import {
  Briefcase,
  Building2,
  HelpCircle,
  LineChart,
  Plus,
  Receipt,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmployerActionCard,
  EmployerDetailField,
  EmployerPageSection,
  EmployerStatCard,
} from "@/components/employer/employer-ui";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/profile";

const quickActions = [
  {
    title: "Post a new job",
    description: "Create a role and start matching candidates",
    href: "/employer/jobs/new",
    icon: Plus,
    accent: "hover:bg-purple-500/5 text-purple-600",
  },
  {
    title: "Manage jobs",
    description: "View and edit your active postings",
    href: "/employer/jobs",
    icon: Briefcase,
    accent: "hover:bg-emerald-500/5 text-emerald-600",
  },
  {
    title: "Unlocked candidates",
    description: "Profiles you have purchased",
    href: "/employer/unlocked",
    icon: Users,
    accent: "hover:bg-blue-500/5 text-blue-600",
  },
  {
    title: "Employer profile",
    description: "Update company and contact details",
    href: "/employer/company",
    icon: Building2,
    accent: "hover:bg-cyan-500/5 text-cyan-600",
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function EmployerDashboard() {
  const user = await requireRole("employer");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const employerId = profile?.id;

  const { count: totalJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("employer_id", employerId ?? "");

  const { count: unlockCount } = await supabase
    .from("unlocks")
    .select("*", { count: "exact", head: true })
    .eq("employer_id", employerId ?? "");

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("employer_id", employerId ?? "")
    .eq("status", "paid");

  const totalSpent = payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const displayName = user.name?.split(" ")[0] || profile?.contact_person_name?.split(" ")[0];

  const detailFields = [
    { label: "Employer Name", value: profile?.contact_person_name },
    { label: "Company", value: profile?.company_name },
    { label: "Contact Email", value: profile?.contact_person_email },
    { label: "Contact Phone", value: profile?.contact_person_phone },
    { label: "Website", value: profile?.website },
    { label: "Industry", value: profile?.industry },
    { label: "Company Size", value: profile?.company_size },
    { label: "UEN / Registration", value: profile?.registration_number },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-slate-500">
          {getGreeting()}
          {displayName ? `, ${displayName}` : ""}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
          What would you like to do today?
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Manage postings, review matches, and unlock candidate profiles from one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {quickActions.map((action) => (
          <EmployerActionCard key={action.href} {...action} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <EmployerStatCard
          label="Jobs Posted"
          value={totalJobs ?? 0}
          icon={Briefcase}
          accent="from-emerald-500/10 to-emerald-600/5 text-emerald-600"
        />
        <EmployerStatCard
          label="Candidates Unlocked"
          value={unlockCount ?? 0}
          icon={Users}
          accent="from-blue-500/10 to-blue-600/5 text-blue-600"
        />
        <EmployerStatCard
          label="Total Spent"
          value={formatCurrency(totalSpent)}
          icon={Receipt}
          accent="from-amber-500/10 to-amber-600/5 text-amber-600"
        />
      </div>

      <EmployerPageSection
        title="Employer Details"
        description="Your organization profile on Deep HR Match"
        icon={<Building2 className="h-6 w-6" />}
        gradient="from-cyan-500 to-cyan-600"
        action={
          <Button variant="outline" size="sm" className="rounded-lg" asChild>
            <Link href="/employer/company">Edit profile</Link>
          </Button>
        }
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          {detailFields.map((field) => (
            <EmployerDetailField key={field.label} {...field} />
          ))}
        </dl>
      </EmployerPageSection>

      <EmployerPageSection
        title="Support"
        description="Get help with your employer account"
        icon={<HelpCircle className="h-6 w-6" />}
        gradient="from-slate-500 to-slate-600"
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="rounded-lg" asChild>
            <Link href="/#features">
              <HelpCircle className="mr-2 h-4 w-4" />
              Frequently Asked Questions
            </Link>
          </Button>
          <Button variant="outline" className="rounded-lg" asChild>
            <Link href="mailto:info@deephrmatch.com">Contact Support</Link>
          </Button>
          <Button variant="outline" className="rounded-lg" asChild>
            <Link href="/employer/jobs">
              <LineChart className="mr-2 h-4 w-4" />
              View matching activity
            </Link>
          </Button>
        </div>
      </EmployerPageSection>
    </div>
  );
}
