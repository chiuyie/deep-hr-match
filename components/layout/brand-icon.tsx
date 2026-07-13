import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandIconProps {
  className?: string;
  iconClassName?: string;
}

export function BrandIcon({ className, iconClassName }: BrandIconProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm",
        className
      )}
    >
      <Brain className={cn("h-[52%] w-[52%]", iconClassName)} strokeWidth={2.25} />
    </div>
  );
}
