import Link from "next/link";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth/actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const roleLabel =
    params.role === "employer" ? "Employer" : params.role === "candidate" ? "Candidate" : "";

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <PublicNav />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>
              {roleLabel ? `Log In as ${roleLabel}` : "Log In"}
            </CardTitle>
            <CardDescription>
              Access your Deep HR Match account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signIn} className="space-y-4">
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
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                Log In
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link
                href={`/auth/sign-up${params.role ? `?role=${params.role}` : ""}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Get Started
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}
