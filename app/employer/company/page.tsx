import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { saveEmployerProfile } from "@/lib/employer/actions";

export default async function EmployerCompanyPage() {
  const user = await requireRole("employer");
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const p = profile ?? {};

  return (
    <DashboardShell
      role="employer"
      userName={user.name}
      title="Company Profile"
      description="Your organization details"
    >
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveEmployerProfile} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input id="company_name" name="company_name" defaultValue={p.company_name ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration_number">UEN / Registration Number</Label>
              <Input id="registration_number" name="registration_number" defaultValue={p.registration_number ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" name="industry" defaultValue={p.industry ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_size">Company Size</Label>
              <Input id="company_size" name="company_size" defaultValue={p.company_size ?? ""} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" defaultValue={p.website ?? ""} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="company_description">Description</Label>
              <Textarea id="company_description" name="company_description" defaultValue={p.company_description ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person_name">Contact Person</Label>
              <Input id="contact_person_name" name="contact_person_name" defaultValue={p.contact_person_name ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person_email">Contact Email</Label>
              <Input id="contact_person_email" name="contact_person_email" type="email" defaultValue={p.contact_person_email ?? ""} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contact_person_phone">Contact Phone</Label>
              <Input id="contact_person_phone" name="contact_person_phone" defaultValue={p.contact_person_phone ?? ""} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="bg-[#1e40af] hover:bg-[#1e3a8a]">Save Profile</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
