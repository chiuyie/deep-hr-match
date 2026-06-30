import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  saveMatrixCategory,
  saveMatrixQuestion,
  saveMatrixOption,
} from "@/lib/admin/actions";

export default async function AdminMatrixPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("matrix_categories")
    .select("*, matrix_questions(*, matrix_options(*))")
    .order("sort_order");

  return (
    <DashboardShell
      role="admin"
      title="7×7 Form Management"
      description="Manage categories, questions, and options"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Add Category</CardTitle></CardHeader>
          <CardContent>
            <form action={saveMatrixCategory} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input id="sort_order" name="sort_order" type="number" defaultValue={0} />
              </div>
              <Button type="submit">Create Category</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Add Question</CardTitle></CardHeader>
          <CardContent>
            <form action={saveMatrixQuestion} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <select id="category_id" name="category_id" required className="flex h-9 w-full rounded-md border px-3 text-sm">
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="question_text">Question</Label>
                <Input id="question_text" name="question_text" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="question_type">Type</Label>
                <select id="question_type" name="question_type" className="flex h-9 w-full rounded-md border px-3 text-sm">
                  <option value="single_select">Single Select</option>
                  <option value="multi_select">Multi Select</option>
                  <option value="text">Text</option>
                  <option value="scale">Scale</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_role">Target Role</Label>
                <select id="target_role" name="target_role" className="flex h-9 w-full rounded-md border px-3 text-sm">
                  <option value="candidate">Candidate</option>
                  <option value="employer">Employer</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <Button type="submit">Create Question</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 space-y-6">
        {(categories ?? []).map((cat) => (
          <Card key={cat.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{cat.name}</CardTitle>
              <Badge variant={cat.is_active ? "default" : "secondary"}>
                {cat.is_active ? "Active" : "Inactive"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{cat.description}</p>
              {(cat.matrix_questions ?? []).map((q: {
                id: string;
                question_text: string;
                is_active: boolean;
                target_role: string;
                matrix_options: { id: string; option_text: string; is_active: boolean }[];
              }) => (
                <div key={q.id} className="rounded border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{q.question_text}</p>
                    <Badge variant="outline">{q.target_role}</Badge>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {q.matrix_options?.map((o) => (
                      <li key={o.id}>• {o.option_text}</li>
                    ))}
                  </ul>
                  <form action={saveMatrixOption} className="mt-3 flex gap-2">
                    <input type="hidden" name="question_id" value={q.id} />
                    <Input name="option_text" placeholder="New option" required />
                    <Input name="option_value" placeholder="value" required />
                    <Button type="submit" size="sm">Add Option</Button>
                  </form>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
