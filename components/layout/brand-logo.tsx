import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { BrandIcon } from "./brand-icon";

interface BrandLogoProps {
  className?: string;
  href?: string;
  variant?: "default" | "image";
  compact?: boolean;
}

export function BrandLogo({
  className,
  href = "/",
  variant = "default",
  compact = false,
}: BrandLogoProps) {
  if (variant === "image") {
    return (
      <Link href={href} className={cn("inline-flex shrink-0", className)}>
        <Image
          src="/brand-logo.png"
          alt="Deep HR Match"
          width={200}
          height={48}
          className="h-9 w-auto"
          priority
        />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn("flex items-center", compact ? "justify-center" : "gap-2.5", className)}
      title={compact ? "Deep HR Match" : undefined}
    >
      <BrandIcon className={compact ? "h-9 w-9" : "h-9 w-9"} />
      {!compact && (
        <span className="text-lg font-bold tracking-tight text-foreground dark:text-white">
          Deep HR Match
        </span>
      )}
    </Link>
  );
}
