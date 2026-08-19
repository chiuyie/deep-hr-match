import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="mt-2 h-4 w-56" />
      <Skeleton className="mt-6 h-40 w-full rounded-xl" />
    </div>
  );
}
