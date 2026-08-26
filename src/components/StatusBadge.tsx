import { statusColor } from "@/lib/cali";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const color = statusColor(status);

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-[3px] px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-white",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {status}
    </span>
  );
}

export function StatusDot({ status }: { status: string }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: statusColor(status) }}
    />
  );
}
