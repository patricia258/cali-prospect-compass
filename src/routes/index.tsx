import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/Shell";
import { StatusBadge } from "@/components/StatusBadge";
import { LeadDrawer } from "@/components/LeadDrawer";
import { Button } from "@/components/ui/button";
import { fetchLeads, type Lead } from "@/lib/db";
import {
  FUNIL,
  SINAIS_QUENTES,
  diasDesde,
  formatData,
  prontoParaAbordagem,
  statusColor,
  temCanalContato,
} from "@/lib/cali";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cockpit de prospecção · Cali" },
      {
        name: "description",
        content:
          "Fila de trabalho diária, pipeline, follow-ups vencidos e conversão por sinal da prospecção da Cali.",
      },
      { property: "og:title", content: "Cockpit de prospecção · Cali" },
      {
        property: "og:description",
        content: "Fila de trabalho, pipeline e conversão da prospecção ativa da Cali.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Painel,
});

type FilaId =
  | "vencidos"
  | "hoje"
  | "quentes"
  | "prontos"
  | "enriquecer"
  | "conversas"
  | "esfriando";

function Painel() {
  const { data: leads = [], isLoading } = useQuery({ queryKey: ["leads"], queryFn: fetchLeads });
  const [fila, setFila] = useState<FilaId>("vencidos");
  const [aberto, setAberto] = useState<Lead | null>(null);

  const hoje = new Date().toISOString().slice(0, 10);
  const emSete = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const g = useMemo(() => {
    const abordados = leads.filter((l) => l.primeiro_contato_em);
    const responderam = leads.filter((l) => l.respondeu_em);
    return {
      vencidos: leads.filter(
        (l) => l.proximo_followup && l.proximo_followup < hoje && l.status !== "Cliente",
      ),
      hoje: leads.filter((l) => l.proximo_followup === hoje),
      semana: leads.filter(
        (l) => l.proximo_followup && l.proximo_followup >= hoje && l.proximo_followup <= emSete,
      ),
      quentes: leads.filter(
        (l) => SINAIS_QUENTES.has(l.sinal_compra || "") && !l.primeiro_contato_em,
      ),
      prontos: leads.filter((l) => prontoParaAbordagem(l) && !l.primeiro_contato_em),
      enriquecer: leads.filter((l) => !prontoParaAbordagem(l) && !l.primeiro_contato_em),
      conversas: leads.filter(
        (l) => l.status === "Conversa aberta" || l.status === "Diagnóstico agendado",
      ),
      esfriando: leads.filter(
        (l) =>
          l.primeiro_contato_em &&
          !l.respondeu_em &&
          diasDesde(l.atualizado_em) >= 10 &&
          l.status !== "Cliente" &&
          l.status !== "Sem fit / perdido",
      ),
      abordados,
      responderam,
      comCanal: leads.filter(temCanalContato),
      clientes: leads.filter((l) => l.status === "Cliente"),
      propostas: leads.filter((l) => l.status === "Proposta enviada" || l.proposta_enviada_em),
    };
  }, [leads, hoje, emSete]);

  const taxa = g.abordados.length
    ? Math.round((g.responderam.length / g.abordados.length) * 100)
    : 0;

  const FILAS: { id: FilaId; label: string; itens: Lead[]; tom: "urgente" | "quente" | "neutro" }[] =
    [
      { id: "vencidos", label: "Follow-up vencido", itens: g.vencidos, tom: "urgente" },
      { id: "hoje", label: "Retorno hoje", itens: g.hoje, tom: "urgente" },
      { id: "quentes", label: "Sinal quente", itens: g.quentes, tom: "quente" },
      { id: "prontos", label: "Pronto p/ abordar", itens: g.prontos, tom: "quente" },
      { id: "conversas", label: "Conversas ativas", itens: g.conversas, tom: "neutro" },
      { id: "esfriando", label: "Esfriando", itens: g.esfriando, tom: "urgente" },
      { id: "enriquecer", label: "Enriquecer", itens: g.enriquecer, tom: "neutro" },
    ];

  const ativa = FILAS.find((f) => f.id === fila) ?? FILAS[0];
  const linhas = [...ativa.itens]
    .sort((a, b) => (a.proximo_followup || "9999").localeCompare(b.proximo_followup || "9999"))
    .slice(0, 25);

  const funil = FUNIL.map((etapa) => ({
    etapa,
    total: leads.filter((l) => l.status === etapa).length,
  }));
  const maxFunil = Math.max(1, ...funil.map((f) => f.total));

  return (
    <Shell
      title="Cockpit de prospecção"
      subtitle="Fila de trabalho do dia, pipeline e conversão — clique em qualquer linha para abrir o lead."
      actions={
        <Button asChild variant="outline">
          <Link to="/leads">Base completa</Link>
        </Button>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando dados…</p>
      ) : (
        <div className="space-y-6">
          {/* Barra de indicadores densa */}
          <section className="grid grid-cols-2 divide-x divide-border overflow-hidden rounded-md border bg-card sm:grid-cols-3 lg:grid-cols-6">
            <Kpi valor={leads.length} label="Leads na base" />
            <Kpi valor={g.comCanal.length} label="Com canal" />
            <Kpi valor={g.abordados.length} label="Abordados" />
            <Kpi valor={`${taxa}%`} label="Taxa de resposta" alerta={taxa < 20} />
            <Kpi valor={g.propostas.length} label="Propostas" />
            <Kpi valor={g.clientes.length} label="Clientes" />
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            {/* Fila de trabalho */}
            <section className="overflow-hidden rounded-md border bg-card">
              <div className="flex flex-wrap gap-1 border-b bg-secondary/40 p-1.5">
                {FILAS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFila(f.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-[3px] px-2.5 py-1.5 text-xs font-medium transition-colors",
                      f.id === fila
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-background hover:text-foreground",
                    )}
                  >
                    {f.label}
                    <span
                      className={cn(
                        "rounded-[3px] px-1 tabular-nums",
                        f.id === fila
                          ? "bg-primary-foreground/20"
                          : f.tom === "urgente" && f.itens.length > 0
                            ? "bg-destructive/15 text-destructive"
                            : "bg-secondary",
                      )}
                    >
                      {f.itens.length}
                    </span>
                  </button>
                ))}
              </div>

              {linhas.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  Nada nesta fila. Boa — siga para a próxima.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-background/60 text-left">
                      <th className="label-eyebrow px-4 py-2">Empresa</th>
                      <th className="label-eyebrow hidden px-3 py-2 md:table-cell">Decisor</th>
                      <th className="label-eyebrow hidden px-3 py-2 lg:table-cell">Sinal</th>
                      <th className="label-eyebrow px-3 py-2">Status</th>
                      <th className="label-eyebrow px-3 py-2 text-right">Retorno</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l) => {
                      const atrasado = Boolean(l.proximo_followup && l.proximo_followup < hoje);
                      return (
                        <tr
                          key={l.id}
                          onClick={() => setAberto(l)}
                          className="cursor-pointer border-b last:border-0 hover:bg-secondary/50"
                        >
                          <td className="px-4 py-2.5">
                            <span
                              className="mr-2 inline-block h-3.5 w-[3px] translate-y-[2px] rounded-full"
                              style={{ backgroundColor: statusColor(l.status) }}
                            />
                            <span className="font-medium">{l.empresa}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {l.cidade || ""}
                            </span>
                          </td>
                          <td className="hidden px-3 py-2.5 text-muted-foreground md:table-cell">
                            {l.nome_decisor || "—"}
                          </td>
                          <td className="hidden px-3 py-2.5 text-muted-foreground lg:table-cell">
                            {l.sinal_compra || "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <StatusBadge status={l.status} />
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2.5 text-right tabular-nums",
                              atrasado ? "font-semibold text-destructive" : "text-muted-foreground",
                            )}
                          >
                            {formatData(l.proximo_followup)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {ativa.itens.length > linhas.length ? (
                <div className="border-t px-4 py-2 text-xs text-muted-foreground">
                  Mostrando {linhas.length} de {ativa.itens.length} — veja o restante na{" "}
                  <Link to="/leads" className="underline">
                    base completa
                  </Link>
                  .
                </div>
              ) : null}
            </section>

            {/* Pipeline */}
            <aside className="space-y-6">
              <section className="rounded-md border bg-card p-5">
                <h2 className="text-base font-semibold text-primary">Pipeline</h2>
                <div className="mt-4 space-y-3">
                  {funil.map((f) => (
                    <div key={f.etapa}>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-muted-foreground">{f.etapa}</span>
                        <span className="tabular-nums font-semibold text-foreground">{f.total}</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-[2px] bg-secondary">
                        <div
                          className="h-2"
                          style={{
                            width: `${(f.total / maxFunil) * 100}%`,
                            backgroundColor: statusColor(f.etapa),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-md border bg-card p-5">
                <h2 className="text-base font-semibold text-primary">Agenda</h2>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Mini valor={g.vencidos.length} label="Vencidos" alerta />
                  <Mini valor={g.hoje.length} label="Hoje" />
                  <Mini valor={g.semana.length} label="7 dias" />
                </div>
                <div className="mt-4 border-t pt-3">
                  <p className="label-eyebrow">Ritual diário · 30–45 min</p>
                  <ol className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li>1. Localizar até 10 decisores</li>
                    <li>2. Validar até 5 sinais reais</li>
                    <li>3. Enviar até 10 abordagens e follow-ups</li>
                  </ol>
                </div>
              </section>
            </aside>
          </div>

          <section className="grid gap-6 lg:grid-cols-2">
            <Conversao titulo="Conversão por sinal" leads={leads} campo="sinal_compra" />
            <Conversao titulo="Conversão por origem" leads={leads} campo="origem" />
            <Conversao titulo="Conversão por segmento" leads={leads} campo="segmento" />
            <Conversao titulo="Conversão por mensagem" leads={leads} campo="modelo_usado" />
          </section>
        </div>
      )}

      <LeadDrawer lead={aberto} onOpenChange={(open) => !open && setAberto(null)} />
    </Shell>
  );
}

function Kpi({
  valor,
  label,
  alerta,
}: {
  valor: number | string;
  label: string;
  alerta?: boolean;
}) {
  return (
    <div className="px-4 py-3">
      <p
        className={cn(
          "font-display text-2xl leading-none",
          alerta ? "text-destructive" : "text-primary",
        )}
      >
        {valor}
      </p>
      <p className="label-eyebrow mt-1.5">{label}</p>
    </div>
  );
}

function Mini({ valor, label, alerta }: { valor: number; label: string; alerta?: boolean }) {
  return (
    <div className="rounded-[3px] bg-secondary/70 py-2">
      <p
        className={cn(
          "font-display text-xl leading-none",
          alerta && valor > 0 ? "text-destructive" : "text-primary",
        )}
      >
        {valor}
      </p>
      <p className="label-eyebrow mt-1">{label}</p>
    </div>
  );
}

function Conversao({
  titulo,
  leads,
  campo,
}: {
  titulo: string;
  leads: Lead[];
  campo: "sinal_compra" | "origem" | "segmento" | "modelo_usado";
}) {
  const grupos = new Map<string, Lead[]>();
  for (const lead of leads) {
    const chave = lead[campo] || "Não informado";
    grupos.set(chave, [...(grupos.get(chave) || []), lead]);
  }
  const linhas = [...grupos.entries()]
    .map(([nome, itens]) => ({
      nome,
      total: itens.length,
      respostas: itens.filter((l) => l.respondeu_em).length,
    }))
    .sort((a, b) => b.respostas - a.respostas || b.total - a.total)
    .slice(0, 8);
  const maxTaxa = Math.max(
    1,
    ...linhas.map((l) => (l.total ? (l.respostas / l.total) * 100 : 0)),
  );

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <h2 className="border-b px-5 py-3 text-base font-semibold text-primary">{titulo}</h2>
      <table className="w-full text-sm">
        <tbody>
          {linhas.map((linha) => {
            const taxa = linha.total ? Math.round((linha.respostas / linha.total) * 100) : 0;
            return (
              <tr key={linha.nome} className="border-b last:border-0">
                <td className="px-5 py-2">{linha.nome}</td>
                <td className="w-16 py-2 text-right tabular-nums text-muted-foreground">
                  {linha.total}
                </td>
                <td className="w-28 py-2 pr-3">
                  <div className="h-1.5 w-full rounded-[2px] bg-secondary">
                    <div
                      className="h-1.5 rounded-[2px] bg-primary"
                      style={{ width: `${(taxa / maxTaxa) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="w-14 py-2 pr-5 text-right tabular-nums font-medium">{taxa}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
