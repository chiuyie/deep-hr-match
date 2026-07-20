import { Skeleton } from "@/components/ui/skeleton";

export default function EmployerLoading() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-8 w-72" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-4 h-9 w-24" />
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="mt-3 h-4 w-56" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-5 w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
