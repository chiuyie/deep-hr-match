import { Badge } from "@/components/ui/badge";
import { statusBadgeClassName, statusLabel } from "@/lib/utils/profile";

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={statusBadgeClassName(status)}>
      {statusLabel(status)}
    </Badge>
  );
}
