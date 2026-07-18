import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LoginMenu() {
  return (
    <Button
      asChild
      variant="ghost"
      className="text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      <Link href="/auth/sign-in">Log In</Link>
    </Button>
  );
}
