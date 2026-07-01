import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  href?: string;
}

export function BrandLogo({ className, href = "/" }: BrandLogoProps) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
        <BrainCircuit className="h-5 w-5" />
      </div>
      <span className="text-lg font-bold tracking-tight text-blue-600 dark:text-white">
        Deep HR Match
      </span>
    </Link>
  );
}
