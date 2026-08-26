import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/Shell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { fetchLeads, type Lead } from "@/lib/db";
import {
  FUNIL,
  SINAIS_QUENTES,
  formatData,
  prontoParaAbordagem,
  statusColor,
  temCanalContato,
} from "@/lib/cali";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de estratégia · Cali Prospecção" },
      {
        name: "description",
        content: "Sinais, cadência, respostas e oportunidades da prospecção ativa da Cali.",
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
  const seteDiasAtras = new Date(Date.now() - 7 * 86400000).toISOString();
  const seteDiasFrente = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const novosSemana = leads.filter((l) => l.criado_em >= seteDiasAtras);
  const comCanal = leads.filter(temCanalContato);
  const semTelefone = leads.filter((l) => !l.telefone);
  const semEmail = leads.filter((l) => !l.email);
  const semWhatsapp = leads.filter((l) => l.whatsapp !== "Sim");
  const semDecisor = leads.filter((l) => !l.nome_decisor);
  const semLinkedinDecisor = leads.filter((l) => !l.linkedin_decisor);
  const semSinalVerificado = leads.filter(
    (l) =>
      !l.sinal_compra ||
      (l.sinal_compra !== "Sem sinal forte" && !l.sinal_detalhe) ||
      (l.sinal_compra === "Sem sinal forte" && !l.angulo_abordagem),
  );
  const prontos = leads.filter(prontoParaAbordagem);
  const filaEnriquecimento = leads.filter((l) => !prontoParaAbordagem(l) && !l.primeiro_contato_em);
  const sinaisQuentes = leads.filter((l) => SINAIS_QUENTES.has(l.sinal_compra || ""));
  const abordados = leads.filter((l) => l.primeiro_contato_em);
  const responderam = leads.filter((l) => l.respondeu_em);
  const taxaResposta = abordados.length
    ? `${Math.round((responderam.length / abordados.length) * 100)}%`
    : "0%";
  const conversas = leads.filter((l) => l.status === "Conversa aberta");
  const reunioes = leads.filter((l) => l.status === "Diagnóstico agendado");
  const mapas = leads.filter(
    (l) => l.mapa_people_em || l.status === "Mapa de People enviado/realizado",
  );
  const propostas = leads.filter((l) => l.proposta_enviada_em || l.status === "Proposta enviada");
  const clientes = leads.filter((l) => l.status === "Cliente");
  const followupVencido = leads.filter(
    (l) => l.proximo_followup && l.proximo_followup < hoje && l.status !== "Cliente",
  );
  const followupHoje = leads.filter((l) => l.proximo_followup === hoje);
  const followupSeteDias = leads.filter(
    (l) => l.proximo_followup && l.proximo_followup >= hoje && l.proximo_followup <= seteDiasFrente,
  );

  const funil = FUNIL.map((etapa) => ({
    etapa,
    total: leads.filter((l) => l.status === etapa).length,
  }));
  const maxFunil = Math.max(1, ...funil.map((f) => f.total));

  return (
    <Shell
      title="Central de prospecção"
      subtitle="ICP, sinais, abordagem, cadência e métricas em uma única rotina comercial."
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
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-6">
            <Metric valor={novosSemana.length} label="Novos na semana" />
            <Metric valor={comCanal.length} label="Com canal de contato" />
            <Metric
              valor={filaEnriquecimento.length}
              label="Fila de enriquecimento"
              hint="Ainda não devem receber abordagem"
            />
            <Metric valor={prontos.length} label="Prontos para abordar" />
            <Metric valor={sinaisQuentes.length} label="Com sinal quente" />
            <Metric valor={abordados.length} label="Abordagens enviadas" />
            <Metric
              valor={taxaResposta}
              label="Taxa de resposta"
              hint="Meta do playbook: acima de 20%"
            />
            <Metric valor={conversas.length} label="Conversas abertas" />
            <Metric valor={reunioes.length} label="Diagnósticos agendados" />
            <Metric valor={mapas.length} label="Mapas realizados" />
            <Metric valor={propostas.length} label="Propostas enviadas" />
            <Metric valor={clientes.length} label="Clientes" />
            <Metric valor={followupVencido.length} label="Follow-ups vencidos" />
          </section>

          <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <div className="rounded-md border bg-card p-6 shadow-card">
              <h2 className="text-xl text-primary">Pipeline comercial</h2>
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
              <h2 className="text-xl text-primary">Agenda de follow-up</h2>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <MiniNumero valor={followupVencido.length} label="Vencidos" />
                <MiniNumero valor={followupHoje.length} label="Hoje" />
                <MiniNumero valor={followupSeteDias.length} label="7 dias" />
              </div>
              <ListaCurta
                className="mt-5 border-0 p-0 shadow-none"
                titulo="Próximos retornos"
                vazio="Nenhum retorno programado."
                leads={followupSeteDias.slice(0, 6)}
                detalhe={(l) => formatData(l.proximo_followup)}
              />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <div className="rounded-md border bg-card p-6 shadow-card">
              <h2 className="text-xl text-primary">Completude dos contatos</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Lacunas que impedem ou limitam a abordagem.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MiniNumero valor={semDecisor.length} label="Sem decisor" />
                <MiniNumero valor={semLinkedinDecisor.length} label="Sem LinkedIn decisor" />
                <MiniNumero valor={semSinalVerificado.length} label="Sem sinal verificado" />
                <MiniNumero valor={semTelefone.length} label="Sem telefone" />
                <MiniNumero valor={semEmail.length} label="Sem e-mail" />
                <MiniNumero valor={semWhatsapp.length} label="Sem WhatsApp" />
              </div>
            </div>
            <div className="rounded-md border border-dourado/40 bg-dourado/10 p-6">
              <p className="label-eyebrow">Ritual diário</p>
              <h2 className="mt-1 text-xl text-primary">30–45 minutos</h2>
              <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>1. Localizar até 10 decisores · 15 min</li>
                <li>2. Validar até 5 sinais reais · 15 min</li>
                <li>3. Enviar até 10 abordagens e follow-ups · 15 min</li>
              </ol>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Conversao titulo="Conversão por sinal" leads={leads} campo="sinal_compra" />
            <Conversao titulo="Conversão por origem" leads={leads} campo="origem" />
            <Conversao titulo="Conversão por segmento" leads={leads} campo="segmento" />
            <Conversao titulo="Conversão por mensagem" leads={leads} campo="modelo_usado" />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <ListaCurta
              titulo="Próximos para enriquecer"
              vazio="Todos os leads estão prontos ou já foram abordados."
              leads={filaEnriquecimento.slice(0, 8)}
              detalhe={(l) => (!l.nome_decisor ? "Localizar decisor" : "Validar sinal e ângulo")}
            />
            <ListaCurta
              titulo="Retornos vencidos"
              vazio="Nenhum follow-up atrasado."
              leads={followupVencido.slice(0, 8)}
              detalhe={(l) => `Retorno em ${formatData(l.proximo_followup)}`}
            />
            <ListaCurta
              titulo="Sinais quentes ainda sem abordagem"
              vazio="Nenhum sinal quente aguardando abordagem."
              leads={sinaisQuentes.filter((l) => !l.primeiro_contato_em).slice(0, 8)}
              detalhe={(l) => l.sinal_compra || "Sem sinal forte"}
            />
          </section>
        </div>
      )}
    </Shell>
  );
}

function MiniNumero({ valor, label }: { valor: number; label: string }) {
  return (
    <div className="rounded-md bg-secondary/70 p-3 text-center">
      <p className="font-display text-2xl text-primary">{valor}</p>
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

  return (
    <div className="rounded-md border bg-card p-6 shadow-card">
      <h2 className="text-xl text-primary">{titulo}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="label-eyebrow py-2">Grupo</th>
              <th className="label-eyebrow py-2 text-right">Leads</th>
              <th className="label-eyebrow py-2 text-right">Resposta</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha.nome} className="border-b last:border-0">
                <td className="py-2.5">{linha.nome}</td>
                <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                  {linha.total}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {linha.total ? Math.round((linha.respostas / linha.total) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListaCurta({
  titulo,
  leads,
  detalhe,
  vazio,
  className = "",
}: {
  titulo: string;
  leads: Lead[];
  detalhe: (l: Lead) => string;
  vazio: string;
  className?: string;
}) {
  return (
    <div className={`rounded-md border bg-card p-6 shadow-card ${className}`}>
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
