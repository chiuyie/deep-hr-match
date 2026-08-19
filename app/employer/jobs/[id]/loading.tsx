import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full max-w-md rounded-xl" />
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
        <Skeleton className="mt-6 h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
