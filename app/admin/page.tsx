import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Database, Settings, Users } from "lucide-react";

const adminTasks = [
  {
    title: "User Access Control",
    description:
      "Manage user roles, permissions, and access levels for the entire system.",
    href: "/admin/candidates",
    icon: Users,
  },
  {
    title: "Manage Level Data",
    description:
      "Import, export, and manage the hierarchical data for skills, domains, and more.",
    href: "/admin/matrix",
    icon: Database,
  },
  {
    title: "View All Employers",
    description: "View all employers in the system.",
    href: "/admin/employers",
    icon: Settings,
  },
];

export default async function AdminDashboard() {
  const user = await requireRole("admin");
  const supabase = await createClient();

  const counts = await Promise.all([
    supabase.from("candidate_profiles").select("*", { count: "exact", head: true }),
    supabase.from("employer_profiles").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("match_results").select("*", { count: "exact", head: true }),
    supabase.from("payments").select("*", { count: "exact", head: true }),
    supabase.from("unlocks").select("*", { count: "exact", head: true }),
  ]);

  const labels = [
    "Total Candidates",
    "Total Employers",
    "Total Jobs",
    "Matching Results",
    "Payments",
    "Unlocks",
  ];

  return (
    <DashboardShell role="admin" userName={user.name} title="Admin Dashboard">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Admin Dashboard</h2>
          <p className="mt-1 text-slate-500">
            Select an administrative task to continue.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminTasks.map((task) => (
            <Link key={task.title} href={task.href}>
              <Card className="h-full border-slate-200 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                <CardHeader>
                  <task.icon className="mb-2 h-8 w-8 text-blue-600" />
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">{task.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Platform Overview
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {counts.map((c, i) => (
              <Card key={labels[i]} className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    {labels[i]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-slate-900">
                    {c.count ?? 0}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
