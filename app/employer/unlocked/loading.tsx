import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <Skeleton className="h-6 w-52" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
