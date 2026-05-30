import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusStyles } from "@/lib/data-utils";
import type { OrderStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={cn("rounded-full border px-2.5 py-1", statusStyles[status])}>
      {status}
    </Badge>
  );
}
