import Link from "next/link";
import {
  CreditCard,
  HelpCircle,
  LineChart,
  Pencil,
  Plus,
  Receipt,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole, ensureEmployerProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/profile";

const actionCards = [
  {
    label: "Purchased Candidates Profiles",
    href: "/employer/unlocked",
    className: "bg-primary hover:bg-primary/90",
    icon: Users,
  },
  {
    label: "Posted Jobs",
    href: "/employer/jobs",
    className: "bg-emerald-600 hover:bg-emerald-700",
    icon: LineChart,
  },
  {
    label: "Create New Job",
    href: "/employer/jobs/new",
    className: "bg-purple-600 hover:bg-purple-700",
    icon: Plus,
  },
  {
    label: "My Transactions",
    href: "/employer/unlocked",
    className: "bg-orange-600 hover:bg-orange-700",
    icon: Receipt,
  },
  {
    label: "Credit Card Management",
    href: "/employer/company",
    className: "bg-cyan-600 hover:bg-cyan-700",
    icon: CreditCard,
  },
  {
    label: "View Candidate Distribution",
    href: "/employer/jobs",
    className: "bg-indigo-600 hover:bg-indigo-700",
    icon: LineChart,
  },
];

export default async function EmployerDashboard() {
  const user = await requireRole("employer");
  await ensureEmployerProfile(user.id);
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

  const detailFields = [
    { label: "Employer Name", value: profile?.contact_person_name },
    { label: "Parent Company", value: profile?.company_name },
    { label: "Contact Email", value: profile?.contact_person_email },
    { label: "Contact Phone", value: profile?.contact_person_phone },
    { label: "Website", value: profile?.website },
    { label: "Domain/Industry", value: profile?.industry },
    { label: "Company Size", value: profile?.company_size },
    { label: "Registration UEN Number", value: profile?.registration_number },
  ];

  return (
    <DashboardShell role="employer" userName={user.name} title="Employer Dashboard">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Good Day</h2>
          <p className="mt-1 text-muted-foreground">What would you like to do today?</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {actionCards.map((action) => (
            <Button
              key={action.label}
              className={`h-auto justify-start gap-3 rounded-xl px-5 py-4 text-left text-white ${action.className}`}
              asChild
            >
              <Link href={action.href}>
                <action.icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Employer Details</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/employer/company">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                {detailFields.map((field) => (
                  <div key={field.label} className="rounded-lg border border-border bg-muted/50 p-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {field.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">
                      {field.value || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Dashboard Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Jobs Posted", value: totalJobs ?? 0 },
                { label: "Candidates Purchased", value: unlockCount ?? 0 },
                { label: "Total Spent", value: formatCurrency(totalSpent) },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border border-border bg-muted/50 p-4"
                >
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {metric.value}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Support</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/#features">
                <HelpCircle className="mr-2 h-4 w-4" />
                Frequently Asked Questions
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="mailto:info@deephrmatch.com">Contact Support</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
