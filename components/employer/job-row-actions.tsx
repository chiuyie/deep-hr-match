import Link from "next/link";
import { Eye, Pencil, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  canEditJob,
  canOpenMatchingPage,
  matchingActionLabel,
  type JobLifecycleState,
} from "@/lib/employer/job-rules";

interface JobRowActionsProps {
  jobId: string;
  lifecycle: JobLifecycleState;
  compact?: boolean;
}

export function JobRowActions({ jobId, lifecycle, compact = false }: JobRowActionsProps) {
  const showEdit = canEditJob(lifecycle);
  const showMatching = canOpenMatchingPage(lifecycle);
  const matchingLabel = matchingActionLabel(lifecycle);

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="outline" size="sm" className="rounded-lg" asChild>
        <Link href={`/employer/jobs/${jobId}/view`}>
          <Eye className={compact ? "mr-1.5 h-3.5 w-3.5" : "mr-1.5 h-4 w-4"} />
          View
        </Link>
      </Button>
      {showEdit && (
        <Button variant="outline" size="sm" className="rounded-lg" asChild>
          <Link href={`/employer/jobs/${jobId}`}>
            <Pencil className={compact ? "mr-1.5 h-3.5 w-3.5" : "mr-1.5 h-4 w-4"} />
            Edit
          </Link>
        </Button>
      )}
      {showMatching && (
        <Button size="sm" className="rounded-lg" asChild>
          <Link href={`/employer/jobs/${jobId}/matching`}>
            <Target className={compact ? "mr-1.5 h-3.5 w-3.5" : "mr-1.5 h-4 w-4"} />
            {matchingLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}
