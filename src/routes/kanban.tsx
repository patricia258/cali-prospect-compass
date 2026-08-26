import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Shell } from "@/components/Shell";
import { LeadDrawer } from "@/components/LeadDrawer";
import { STATUS_LIST, statusColor } from "@/lib/cali";
import { atualizarLead, fetchLeads, type Lead } from "@/lib/db";

export const Route = createFileRoute("/kanban")({
  head: () => ({
    meta: [
      { title: "Kanban · Cali Prospecção" },
      {
        name: "description",
        content: "Pipeline de prospecção em colunas, com arrastar e soltar entre status.",
      },
      { property: "og:title", content: "Kanban · Cali Prospecção" },
      {
        property: "og:description",
        content: "Pipeline de prospecção em colunas, com arrastar e soltar entre status.",
      },
    ],
  }),
  component: Kanban,
});

function Kanban() {
  const qc = useQueryClient();
  const { data: leads = [] } = useQuery({ queryKey: ["leads"], queryFn: fetchLeads });
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [aberto, setAberto] = useState<Lead | null>(null);
  const [colunasFechadas, setColunasFechadas] = useState<Set<string>>(new Set());

  const mover = useMutation({
    mutationFn: ({ lead, status }: { lead: Lead; status: string }) =>
      atualizarLead(lead, { status }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`${vars.lead.empresa} → ${vars.status}`);
    },
    onError: () => toast.error("Não foi possível mover o lead."),
  });

  return (
    <Shell
      title="Kanban do pipeline"
      subtitle="Arraste um cartão para mudar o status. Cada movimento fica registrado no histórico do lead."
    >
      <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8">
        {STATUS_LIST.map((status) => {
          const coluna = leads.filter((l) => l.status === status);
          const fechada = colunasFechadas.has(status);
          return (
            <section
              key={status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const lead = leads.find((l) => l.id === arrastando);
                setArrastando(null);
                if (lead && status === "Sem fit / perdido" && !lead.perdido_motivo) {
                  setAberto(lead);
                  toast.info("Abra o status “Sem fit / perdido” na ficha e informe o motivo.");
                  return;
                }
                if (lead && lead.status !== status) mover.mutate({ lead, status });
              }}
              className={
                fechada
                  ? "flex w-12 shrink-0 flex-col rounded-md border bg-card/70"
                  : "flex w-64 shrink-0 flex-col rounded-md border bg-card/70"
              }
            >
              <header
                className="flex cursor-pointer items-center gap-2 border-b px-3 py-2.5"
                onClick={() =>
                  setColunasFechadas((prev) => {
                    const next = new Set(prev);
                    if (next.has(status)) next.delete(status);
                    else next.add(status);
                    return next;
                  })
                }
              >
                {fechada ? (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: statusColor(status) }}
                />
                {!fechada && (
                  <h2 className="flex-1 truncate font-sans text-xs font-semibold tracking-wide">
                    {status}
                  </h2>
                )}
                <span className="text-xs tabular-nums text-muted-foreground">{coluna.length}</span>
              </header>
              {!fechada && (
                <div className="flex flex-1 flex-col gap-2 p-2">
                  {coluna.map((lead) => (
                    <article
                      key={lead.id}
                      draggable
                      onDragStart={() => setArrastando(lead.id)}
                      onClick={() => setAberto(lead)}
                      className="cursor-grab rounded-sm border bg-card p-3 text-left shadow-card transition-colors hover:border-input active:cursor-grabbing"
                      style={{ borderLeft: `2px solid ${statusColor(status)}` }}
                    >
                      <p className="text-sm font-medium leading-snug">{lead.empresa}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {lead.categoria ?? "—"} · {lead.cidade ?? "—"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {!lead.segmento && (
                          <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                            definir segmento
                          </span>
                        )}
                        {lead.tags?.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <LeadDrawer lead={aberto} onOpenChange={(o) => !o && setAberto(null)} />
    </Shell>
  );
}
