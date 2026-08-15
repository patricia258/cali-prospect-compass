import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/Shell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { fetchLeads, type Lead } from "@/lib/db";
import { DIAS_ESFRIANDO, FUNIL, STATUS_LIST, diasDesde, formatData, statusColor } from "@/lib/cali";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel · Cali Prospecção" },
      {
        name: "description",
        content:
          "Painel de prospecção ativa da Cali: funil, follow-ups e leads de Curitiba em um só lugar.",
      },
      { property: "og:title", content: "Painel · Cali Prospecção" },
      {
        property: "og:description",
        content: "Funil, follow-ups e leads de prospecção ativa da Cali.",
      },
    ],
  }),
  component: Painel,
});

function Metric({ valor, label, hint }: { valor: number | string; label: string; hint?: string }) {
  return (
    <div className="rounded-md border bg-card p-5 shadow-card">
      <p className="font-display text-3xl leading-none text-primary">{valor}</p>
      <p className="label-eyebrow mt-2">{label}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Painel() {
  const { data: leads = [], isLoading } = useQuery({ queryKey: ["leads"], queryFn: fetchLeads });

  const hoje = new Date().toISOString().slice(0, 10);
  const porStatus = STATUS_LIST.map((s) => ({
    status: s,
    total: leads.filter((l) => l.status === s).length,
  }));
  const total = leads.length;
  const naoContatado = leads.filter((l) => l.status === "Não contatado");
  const altaSemContato = naoContatado.filter((l) => l.aderencia === "Alta");
  const followupVencido = leads.filter(
    (l) => l.proximo_followup && l.proximo_followup < hoje && l.status !== "Cliente",
  );
  const esfriando = leads.filter(
    (l) =>
      diasDesde(l.atualizado_em) > DIAS_ESFRIANDO &&
      !["Cliente", "Declinou", "Sem interesse", "Desalinhado"].includes(l.status),
  );
  const semSegmento = leads.filter((l) => !l.segmento);

  const contatados = leads.filter((l) => l.status !== "Não contatado").length;
  const funil = FUNIL.map((s) => ({
    etapa: s,
    total:
      s === "Mensagem enviada"
        ? contatados
        : leads.filter((l) => l.status === s).length +
          (s === "Respondeu"
            ? leads.filter((l) =>
                [
                  "Reunião agendada",
                  "Chamada agendada",
                  "Reunião realizada",
                  "Proposta enviada",
                  "Cliente",
                ].includes(l.status),
              ).length
            : 0),
  }));
  const maxFunil = Math.max(1, ...funil.map((f) => f.total));

  return (
    <Shell
      title="Panorama da prospecção"
      subtitle="Onde o funil está agora, o que já esfriou e o que precisa de retorno hoje."
      actions={
        <Button asChild variant="outline">
          <Link to="/leads">Ver todos os leads</Link>
        </Button>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando dados…</p>
      ) : (
        <div className="space-y-10">
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Metric valor={total} label="Leads na base" />
            <Metric valor={altaSemContato.length} label="Alta aderência sem contato" />
            <Metric
              valor={followupVencido.length}
              label="Follow-ups vencidos"
              hint="Data de retorno já passou"
            />
            <Metric
              valor={esfriando.length}
              label="Esfriando"
              hint={`Sem atualização há mais de ${DIAS_ESFRIANDO} dias`}
            />
            <Metric valor={semSegmento.length} label="Definir segmento" />
          </section>

          <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <div className="rounded-md border bg-card p-6 shadow-card">
              <h2 className="text-xl text-primary">Avanço do funil</h2>
              <div className="mt-6 space-y-4">
                {funil.map((f) => (
                  <div key={f.etapa}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span>{f.etapa}</span>
                      <span className="font-display text-lg text-primary">{f.total}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${(f.total / maxFunil) * 100}%`,
                          backgroundColor: statusColor(f.etapa),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border bg-card p-6 shadow-card">
              <h2 className="text-xl text-primary">Leads por status</h2>
              <ul className="mt-5 space-y-2.5">
                {porStatus.map((s) => (
                  <li key={s.status} className="flex items-center justify-between gap-3">
                    <StatusBadge status={s.status} />
                    <span className="text-sm tabular-nums text-muted-foreground">{s.total}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <ListaCurta
              titulo="Retornos vencidos"
              vazio="Nenhum follow-up atrasado."
              leads={followupVencido.slice(0, 8)}
              detalhe={(l) => `Retorno em ${formatData(l.proximo_followup)}`}
            />
            <ListaCurta
              titulo="Alta aderência ainda sem contato"
              vazio="Tudo contatado por aqui."
              leads={altaSemContato.slice(0, 8)}
              detalhe={(l) => l.categoria ?? "—"}
            />
          </section>
        </div>
      )}
    </Shell>
  );
}

function ListaCurta({
  titulo,
  leads,
  detalhe,
  vazio,
}: {
  titulo: string;
  leads: Lead[];
  detalhe: (l: Lead) => string;
  vazio: string;
}) {
  return (
    <div className="rounded-md border bg-card p-6 shadow-card">
      <h2 className="text-xl text-primary">{titulo}</h2>
      {leads.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{vazio}</p>
      ) : (
        <ul className="mt-4 divide-y">
          {leads.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{l.empresa}</p>
                <p className="truncate text-xs text-muted-foreground">{detalhe(l)}</p>
              </div>
              <StatusBadge status={l.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
