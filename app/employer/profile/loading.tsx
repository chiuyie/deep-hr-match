import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <Skeleton className="h-6 w-44" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-10 w-32 rounded-xl" />
    </div>
  );
}
