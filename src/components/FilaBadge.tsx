import { FILA_CORES, type Fila } from "@/lib/cali";
import { cn } from "@/lib/utils";

export function FilaBadge({
  fila,
  motivo,
  className,
}: {
  fila: Fila;
  motivo?: string;
  className?: string;
}) {
  return (
    <span
      title={motivo}
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-[3px] text-[11px] font-bold text-white",
        className,
      )}
      style={{ backgroundColor: FILA_CORES[fila] }}
    >
      {fila}
    </span>
  );
}
