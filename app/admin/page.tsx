import {
  Briefcase,
  Building2,
  CreditCard,
  FileText,
  Grid3X3,
  ListTree,
  Target,
  Unlock,
  Users,
} from "lucide-react";
import {
  AdminActionCard,
  AdminPageSection,
  AdminStatCard,
} from "@/components/admin/admin-ui";
import { FRAMEWORK_MATCHING_LANGUAGE_FORM } from "@/lib/constants/branding";
import { createClient } from "@/lib/supabase/server";

const peopleActions = [
  {
    title: "Candidates",
    description: "View profiles, status, and completion progress",
    href: "/admin/candidates",
    icon: Users,
    accent: "hover:bg-blue-500/5 text-blue-600",
  },
  {
    title: "Employers",
    description: "Company profiles and contact information",
    href: "/admin/employers",
    icon: Building2,
    accent: "hover:bg-cyan-500/5 text-cyan-600",
  },
];

const operationsActions = [
  {
    title: "Jobs",
    description: "All postings across employers",
    href: "/admin/jobs",
    icon: Briefcase,
    accent: "hover:bg-emerald-500/5 text-emerald-600",
  },
  {
    title: "Matching results",
    description: "Ranked scores and placeholder status",
    href: "/admin/matching",
    icon: Target,
    accent: "hover:bg-violet-500/5 text-violet-600",
  },
  {
    title: "Payments",
    description: "Stripe checkout records",
    href: "/admin/payments",
    icon: CreditCard,
    accent: "hover:bg-amber-500/5 text-amber-600",
  },
  {
    title: "Unlocks",
    description: "Candidate profiles unlocked by employers",
    href: "/admin/unlocks",
    icon: Unlock,
    accent: "hover:bg-rose-500/5 text-rose-600",
  },
  {
    title: "Uploaded files",
    description: "CV and job description documents",
    href: "/admin/files",
    icon: FileText,
    accent: "hover:bg-slate-500/5 text-slate-600",
  },
];

const configActions = [
  {
    title: FRAMEWORK_MATCHING_LANGUAGE_FORM,
    description: "Edit factor names and word levels",
    href: "/admin/matrix",
    icon: Grid3X3,
    accent: "hover:bg-indigo-500/5 text-indigo-600",
  },
  {
    title: "Form Fields",
    description: "Compare and edit candidate vs employer input fields",
    href: "/admin/forms",
    icon: ListTree,
    accent: "hover:bg-violet-500/5 text-violet-600",
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    candidates,
    employers,
    jobs,
    matching,
    payments,
    unlocks,
    cvs,
    jds,
  ] = await Promise.all([
    supabase.from("candidate_profiles").select("*", { count: "exact", head: true }),
    supabase.from("employer_profiles").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("match_results").select("*", { count: "exact", head: true }),
    supabase.from("payments").select("*", { count: "exact", head: true }),
    supabase.from("unlocks").select("*", { count: "exact", head: true }),
    supabase.from("candidate_cv_files").select("*", { count: "exact", head: true }),
    supabase.from("job_jd_files").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Candidates", value: candidates.count ?? 0, href: "/admin/candidates", icon: Users, accent: "from-blue-500/15 to-blue-500/5 text-blue-700" },
    { label: "Employers", value: employers.count ?? 0, href: "/admin/employers", icon: Building2, accent: "from-cyan-500/15 to-cyan-500/5 text-cyan-700" },
    { label: "Jobs", value: jobs.count ?? 0, href: "/admin/jobs", icon: Briefcase, accent: "from-emerald-500/15 to-emerald-500/5 text-emerald-700" },
    { label: "Match results", value: matching.count ?? 0, href: "/admin/matching", icon: Target, accent: "from-violet-500/15 to-violet-500/5 text-violet-700" },
    { label: "Payments", value: payments.count ?? 0, href: "/admin/payments", icon: CreditCard, accent: "from-amber-500/15 to-amber-500/5 text-amber-700" },
    { label: "Unlocks", value: unlocks.count ?? 0, href: "/admin/unlocks", icon: Unlock, accent: "from-rose-500/15 to-rose-500/5 text-rose-700" },
  ];

  const fileCount = (cvs.count ?? 0) + (jds.count ?? 0);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-violet-700">{getGreeting()}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Platform overview
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Monitor users, jobs, matching, payments, and configure the 7^7 matching taxonomy from
          one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <AdminStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            href={stat.href}
            icon={stat.icon}
            accent={stat.accent}
          />
        ))}
        <AdminStatCard
          label="Uploaded files"
          value={fileCount}
          href="/admin/files"
          icon={FileText}
          accent="from-slate-500/15 to-slate-500/5 text-slate-700"
        />
      </div>

      <AdminPageSection
        title="People"
        description="User accounts on the platform"
        gradient="from-blue-600 to-cyan-600"
        icon={<Users className="h-6 w-6" />}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {peopleActions.map((action) => (
            <AdminActionCard key={action.href} {...action} />
          ))}
        </div>
      </AdminPageSection>

      <AdminPageSection
        title="Operations"
        description="Jobs, matching, billing, and documents"
        gradient="from-emerald-600 to-teal-600"
        icon={<Briefcase className="h-6 w-6" />}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {operationsActions.map((action) => (
            <AdminActionCard key={action.href} {...action} />
          ))}
        </div>
      </AdminPageSection>

      <AdminPageSection
        title="Configuration"
        description="Matching framework and taxonomy"
        gradient="from-indigo-600 to-violet-600"
        icon={<Grid3X3 className="h-6 w-6" />}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {configActions.map((action) => (
            <AdminActionCard key={action.href} {...action} />
          ))}
        </div>
      </AdminPageSection>
    </div>
  );
}
