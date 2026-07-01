import Link from "next/link";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth/actions";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const defaultRole = params.role === "employer" ? "employer" : "candidate";

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <PublicNav />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Join Deep HR Match and find your perfect fit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">
                  I am a
                </Label>
                <select
                  id="role"
                  name="role"
                  defaultValue={defaultRole}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="candidate">Candidate</option>
                  <option value="employer">Employer</option>
                </select>
              </div>
              <Button
                type="submit"
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                Get Started
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/sign-in" className="text-blue-600 hover:underline dark:text-blue-400">
                Log In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}
