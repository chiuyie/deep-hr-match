import { Skeleton } from "@/components/ui/skeleton";

export default function CandidateLoading() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-5 h-3 w-full" />
          <Skeleton className="mt-6 h-16 w-full" />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-4 h-20 w-full" />
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <Skeleton className="h-6 w-44" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border/60 bg-background/50 p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
