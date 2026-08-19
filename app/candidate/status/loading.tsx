import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="mt-4 h-20 w-full rounded-xl" />
      <Skeleton className="mt-4 h-10 w-40 rounded-xl" />
    </div>
  );
}
