import { Fragment, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Papa from "papaparse";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Shell } from "@/components/Shell";
import { LeadDrawer } from "@/components/LeadDrawer";
import { ImportDialog } from "@/components/ImportDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ADERENCIAS,
  DIAS_ESFRIANDO,
  PRIORIDADES,
  SEGMENTOS,
  SINAIS_COMPRA,
  STATUS_LIST,
  diasDesde,
  formatData,
  prontoParaAbordagem,
  statusColor,
  temCanalContato,
} from "@/lib/cali";
import {
  criarLead,
  criarVisao,
  excluirVisao,
  fetchLeads,
  fetchLeadsExcluidos,
  fetchVisoes,
  restaurarLead,
  type Lead,
} from "@/lib/db";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Leads · Cali Prospecção" },
      {
        name: "description",
        content:
          "Base completa de leads: filtros combinados, visões salvas, importação de planilha e exportação em CSV.",
      },
      { property: "og:title", content: "Leads · Cali Prospecção" },
      {
        property: "og:description",
        content: "Base completa de leads com filtros, visões salvas e importação de planilha.",
      },
    ],
  }),
  component: Leads,
});

type Ordem = { campo: keyof Lead; dir: "asc" | "desc" };

const COLUNAS: { campo: keyof Lead; label: string; className?: string }[] = [
  { campo: "empresa", label: "Empresa" },
  { campo: "prioridade", label: "Prioridade" },
  { campo: "sinal_compra", label: "Sinal" },
  { campo: "cidade", label: "Cidade" },
  { campo: "status", label: "Status" },
  { campo: "proximo_followup", label: "Follow-up" },
  { campo: "atualizado_em", label: "Atualizado" },
];

function Leads() {
  const qc = useQueryClient();
  const { data: leads = [], isLoading } = useQuery({ queryKey: ["leads"], queryFn: fetchLeads });
  const { data: visoes = [] } = useQuery({ queryKey: ["visoes"], queryFn: fetchVisoes });
  const { data: excluidos = [] } = useQuery({
    queryKey: ["leads-excluidos"],
    queryFn: fetchLeadsExcluidos,
  });

  const [busca, setBusca] = useState("");
  const [aderencia, setAderencia] = useState("todas");
  const [segmento, setSegmento] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [prioridade, setPrioridade] = useState("todas");
  const [sinal, setSinal] = useState("todos");
  const [canal, setCanal] = useState("todos");
  const [followup, setFollowup] = useState("todos");
  const [somenteProntos, setSomenteProntos] = useState(false);
  const [agrupar, setAgrupar] = useState(false);
  const [mostrarLixeira, setMostrarLixeira] = useState(false);
  const [gruposFechados, setGruposFechados] = useState<Set<string>>(new Set());
  const [ordem, setOrdem] = useState<Ordem>({ campo: "atualizado_em", dir: "desc" });
  const [aberto, setAberto] = useState<Lead | null>(null);
  const [importando, setImportando] = useState(false);

  const hoje = new Date().toISOString().slice(0, 10);
  const emSeteDias = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const novo = useMutation({
    mutationFn: () => criarLead(),
    onSuccess: (lead) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      setAberto(lead);
    },
  });

  const salvarVisao = useMutation({
    mutationFn: (nome: string) =>
      criarVisao(nome, {
        aderencia,
        segmento,
        status,
        prioridade,
        sinal,
        canal,
        followup,
        somenteProntos,
        busca,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visoes"] });
      toast.success("Visão salva.");
    },
  });

  const removerVisao = useMutation({
    mutationFn: (id: string) => excluirVisao(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visoes"] }),
  });

  const restaurar = useMutation({
    mutationFn: (id: string) => restaurarLead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["leads-excluidos"] });
      toast.success("Lead restaurado.");
    },
  });

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = leads.filter((l) => {
      if (fila !== "todas" && filaDe(l) !== fila) return false;
      if (enriquecer && !enriquecer.has(l.id)) return false;
      if (aderencia !== "todas" && (l.aderencia ?? "") !== aderencia) return false;
      if (segmento !== "todos") {
        if (segmento === "__vazio__" ? !!l.segmento : l.segmento !== segmento) return false;
      }
      if (status !== "todos" && l.status !== status) return false;
      if (prioridade !== "todas" && l.prioridade !== prioridade) return false;
      if (sinal !== "todos" && (l.sinal_compra || "Sem sinal forte") !== sinal) return false;
      if (somenteProntos && !prontoParaAbordagem(l)) return false;
      if (followup === "vencido" && !(l.proximo_followup && l.proximo_followup < hoje))
        return false;
      if (followup === "hoje" && l.proximo_followup !== hoje) return false;
      if (
        followup === "sete_dias" &&
        !(l.proximo_followup && l.proximo_followup >= hoje && l.proximo_followup <= emSeteDias)
      )
        return false;
      const temLinkedIn = Boolean(l.linkedin_decisor || l.linkedin_empresa);
      const canais: Record<string, boolean> = {
        com_site: Boolean(l.website),
        sem_site: !l.website,
        com_whatsapp: l.whatsapp === "Sim",
        sem_whatsapp: l.whatsapp !== "Sim",
        com_telefone: Boolean(l.telefone),
        sem_telefone: !l.telefone,
        com_email: Boolean(l.email),
        sem_email: !l.email,
        com_linkedin: temLinkedIn,
        sem_linkedin: !temLinkedIn,
        sem_decisor: !l.nome_decisor,
        sem_linkedin_decisor: !l.linkedin_decisor,
        sem_sinal_verificado:
          !l.sinal_compra ||
          (l.sinal_compra !== "Sem sinal forte" && !l.sinal_detalhe) ||
          (l.sinal_compra === "Sem sinal forte" && !l.angulo_abordagem),
        algum_canal: temCanalContato(l),
        sem_canal: !temCanalContato(l),
      };
      if (canal !== "todos" && !canais[canal]) return false;
      if (!termo) return true;
      return [
        l.empresa,
        l.categoria,
        l.cidade,
        l.nome_decisor,
        l.email,
        l.notas,
        l.dor_provavel,
        l.sinal_detalhe,
        l.sinal_fonte_url,
        l.angulo_abordagem,
        ...(l.tags ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(termo);
    });

    const dir = ordem.dir === "asc" ? 1 : -1;
    return [...lista].sort((a, b) => {
      const va = a[ordem.campo];
      const vb = b[ordem.campo];
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), "pt-BR") * dir;
    });
  }, [
    leads,
    busca,
    aderencia,
    segmento,
    status,
    prioridade,
    sinal,
    canal,
    followup,
    somenteProntos,
    ordem,
    hoje,
    emSeteDias,
  ]);

  const grupos = useMemo(() => {
    if (!agrupar) return [{ titulo: null as string | null, itens: filtrados }];
    return STATUS_LIST.map((s) => ({
      titulo: s,
      itens: filtrados.filter((l) => l.status === s),
    })).filter((g) => g.itens.length > 0);
  }, [agrupar, filtrados]);

  function exportar() {
    const cols: (keyof Lead)[] = [
      "empresa",
      "aderencia",
      "segmento",
      "prioridade",
      "icp_fit",
      "categoria",
      "cargo_decisor",
      "cidade",
      "estado",
      "nome_decisor",
      "email",
      "whatsapp",
      "telefone",
      "linkedin_decisor",
      "linkedin_empresa",
      "website",
      "google_maps",
      "nota_google",
      "n_avaliacoes",
      "status",
      "sinal_compra",
      "sinal_detalhe",
      "sinal_fonte_url",
      "sinal_data",
      "dor_provavel",
      "angulo_abordagem",
      "cadencia_status",
      "cadencia_toque",
      "proximo_followup",
      "proximo_passo",
      "origem",
      "objecao",
      "resposta_objecao",
      "perdido_motivo",
      "notas",
    ];
    const csv = Papa.unparse({
      fields: cols as string[],
      data: filtrados.map((l) =>
        cols.map((c) => {
          const v = l[c];
          return Array.isArray(v) ? v.join("; ") : (v ?? "");
        }),
      ),
    });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cali_leads_export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado.");
  }

  function aplicarVisao(filtros: Record<string, unknown>) {
    setAderencia((filtros["aderencia"] as string) ?? "todas");
    setSegmento((filtros["segmento"] as string) ?? "todos");
    setStatus((filtros["status"] as string) ?? "todos");
    setPrioridade((filtros["prioridade"] as string) ?? "todas");
    setSinal((filtros["sinal"] as string) ?? "todos");
    setCanal((filtros["canal"] as string) ?? "todos");
    setFollowup((filtros["followup"] as string) ?? "todos");
    setSomenteProntos(Boolean(filtros["somenteProntos"]));
    setBusca((filtros["busca"] as string) ?? "");
  }

  return (
    <Shell
      title="Base de leads"
      subtitle={`${filtrados.length} de ${leads.length} empresas visíveis com os filtros atuais.`}
      actions={
        <>
          <Button variant="outline" onClick={() => setImportando(true)}>
            Importar
          </Button>
          <Button variant="outline" onClick={exportar}>
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => setMostrarLixeira((v) => !v)}>
            Lixeira ({excluidos.length})
          </Button>
          <Button onClick={() => novo.mutate()}>Novo lead</Button>
        </>
      }
    >
      <div className="space-y-4">
        {mostrarLixeira ? (
          <section className="rounded-md border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl text-primary">Lixeira</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Exclusões são recuperáveis. Nenhum lead é apagado definitivamente pelo painel.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMostrarLixeira(false)}>
                Fechar
              </Button>
            </div>
            <ul className="mt-4 divide-y">
              {excluidos.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{lead.empresa}</p>
                    <p className="text-xs text-muted-foreground">
                      Arquivado em {formatData(lead.excluido_em)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => restaurar.mutate(lead.id)}>
                    Restaurar
                  </Button>
                </li>
              ))}
              {!excluidos.length ? (
                <li className="py-4 text-sm text-muted-foreground">A lixeira está vazia.</li>
              ) : null}
            </ul>
          </section>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 rounded-md border bg-card p-4">
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar empresa, decisor, categoria, etiqueta…"
            className="min-w-52 flex-1"
          />
          <Select value={aderencia} onValueChange={setAderencia}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Aderência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Toda aderência</SelectItem>
              {ADERENCIAS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={segmento} onValueChange={setSegmento}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Segmento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo segmento</SelectItem>
              {SEGMENTOS.map((s) => (
                <SelectItem key={s} value={s}>
                  Segmento {s}
                </SelectItem>
              ))}
              <SelectItem value="__vazio__">Definir segmento</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo status</SelectItem>
              {STATUS_LIST.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={prioridade} onValueChange={setPrioridade}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Toda prioridade</SelectItem>
              {PRIORIDADES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sinal} onValueChange={setSinal}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Sinal de compra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo sinal</SelectItem>
              {SINAIS_COMPRA.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={canal} onValueChange={setCanal}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Dados e canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os dados</SelectItem>
              <SelectItem value="sem_decisor">Sem decisor</SelectItem>
              <SelectItem value="sem_linkedin_decisor">Sem LinkedIn do decisor</SelectItem>
              <SelectItem value="sem_sinal_verificado">Sem sinal verificado</SelectItem>
              <SelectItem value="algum_canal">Tem algum canal</SelectItem>
              <SelectItem value="sem_canal">Sem nenhum canal</SelectItem>
              <SelectItem value="com_site">Tem site</SelectItem>
              <SelectItem value="sem_site">Sem site</SelectItem>
              <SelectItem value="com_whatsapp">Tem WhatsApp</SelectItem>
              <SelectItem value="sem_whatsapp">Sem WhatsApp</SelectItem>
              <SelectItem value="com_telefone">Tem telefone</SelectItem>
              <SelectItem value="sem_telefone">Sem telefone</SelectItem>
              <SelectItem value="com_email">Tem e-mail</SelectItem>
              <SelectItem value="sem_email">Sem e-mail</SelectItem>
              <SelectItem value="com_linkedin">Tem LinkedIn</SelectItem>
              <SelectItem value="sem_linkedin">Sem LinkedIn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={followup} onValueChange={setFollowup}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Follow-up" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo follow-up</SelectItem>
              <SelectItem value="vencido">Vencidos</SelectItem>
              <SelectItem value="hoje">Para hoje</SelectItem>
              <SelectItem value="sete_dias">Próximos 7 dias</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch id="prontos" checked={somenteProntos} onCheckedChange={setSomenteProntos} />
            <Label htmlFor="prontos" className="text-xs">
              Prontos para abordagem
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="agrupar" checked={agrupar} onCheckedChange={setAgrupar} />
            <Label htmlFor="agrupar" className="text-xs">
              Agrupar por status
            </Label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="label-eyebrow">Visões</span>
          {visoes.map((v) => (
            <span key={v.id} className="flex items-center rounded-sm border bg-card">
              <button
                onClick={() => aplicarVisao(v.filtros as Record<string, unknown>)}
                className="px-2.5 py-1 text-xs hover:text-primary"
              >
                {v.nome}
              </button>
              <button
                onClick={() => removerVisao.mutate(v.id)}
                className="px-1.5 py-1 text-xs text-muted-foreground hover:text-destructive"
                aria-label={`Remover visão ${v.nome}`}
              >
                ×
              </button>
            </span>
          ))}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => {
              const nome = window.prompt("Nome da visão");
              if (nome) salvarVisao.mutate(nome);
            }}
          >
            + salvar filtros atuais
          </Button>
        </div>

        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full min-w-3xl text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2.5 text-left">
                  <button
                    className="label-eyebrow hover:text-primary"
                    onClick={() =>
                      setOrdem((o) =>
                        o.campo === "empresa"
                          ? { campo: "empresa", dir: o.dir === "asc" ? "desc" : "asc" }
                          : { campo: "empresa", dir: "asc" },
                      )
                    }
                  >
                    Empresa
                    {ordem.campo === "empresa" ? (ordem.dir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                </th>
                <th className="px-3 py-2.5 text-left">
                  <span className="label-eyebrow" title="Fila derivada de fit e sinal">
                    Fila
                  </span>
                </th>
                {COLUNAS.slice(1).map((c) => (
                  <th key={String(c.campo)} className="px-3 py-2.5 text-left">
                    <button
                      className="label-eyebrow hover:text-primary"
                      onClick={() =>
                        setOrdem((o) =>
                          o.campo === c.campo
                            ? { campo: c.campo, dir: o.dir === "asc" ? "desc" : "asc" }
                            : { campo: c.campo, dir: "asc" },
                        )
                      }
                    >
                      {c.label}
                      {ordem.campo === c.campo ? (ordem.dir === "asc" ? " ↑" : " ↓") : ""}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={COLUNAS.length + 1} className="px-3 py-6 text-muted-foreground">
                    Carregando…
                  </td>
                </tr>
              )}
              {grupos.map((g) => {
                const fechado = g.titulo ? gruposFechados.has(g.titulo) : false;
                return (
                  <Fragment key={g.titulo ?? "todos"}>
                    {g.titulo && (
                      <tr key={`h-${g.titulo}`} className="bg-secondary/60">
                        <td colSpan={COLUNAS.length + 1} className="px-3 py-1.5">
                          <button
                            className="flex w-full items-center gap-2 text-left text-xs font-semibold"
                            onClick={() =>
                              setGruposFechados((prev) => {
                                const next = new Set(prev);
                                if (next.has(g.titulo!)) next.delete(g.titulo!);
                                else next.add(g.titulo!);
                                return next;
                              })
                            }
                          >
                            {fechado ? (
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: statusColor(g.titulo) }}
                            />
                            {g.titulo}
                            <span className="text-muted-foreground">({g.itens.length})</span>
                          </button>
                        </td>
                      </tr>
                    )}
                    {!fechado &&
                      g.itens.map((l) => {
                        const vencido = !!l.proximo_followup && l.proximo_followup < hoje;
                        const esfriando = diasDesde(l.atualizado_em) > DIAS_ESFRIANDO;
                        const { fila: filaLead, motivo } = classificarFila(l);
                        return (
                          <tr
                            key={l.id}
                            onClick={() => setAberto(l)}
                            className="cursor-pointer border-b last:border-0 hover:bg-secondary/50"
                          >
                            <td className="px-3 py-2.5">
                              <span className="font-medium">{l.empresa}</span>
                              <span className="block text-xs text-muted-foreground">
                                {l.categoria ?? "—"}
                              </span>
                              {prontoParaAbordagem(l) ? (
                                <span className="mt-1 inline-block text-[10px] font-medium uppercase tracking-wide text-[#4C7A52]">
                                  pronto para abordagem
                                </span>
                              ) : null}
                            </td>
                            <td className="px-3 py-2.5">
                              <FilaBadge fila={filaLead} motivo={motivo} />
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground">{l.prioridade}</td>
                            <td className="max-w-44 px-3 py-2.5 text-xs text-muted-foreground">
                              {l.sinal_compra || "Sem sinal forte"}
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground">{l.cidade ?? "—"}</td>
                            <td className="px-3 py-2.5">
                              <StatusBadge status={l.status} />
                            </td>
                            <td className="px-3 py-2.5">
                              {l.proximo_followup ? (
                                <span
                                  className="rounded-sm px-1.5 py-0.5 text-xs"
                                  style={
                                    vencido
                                      ? { backgroundColor: "#A5442F1f", color: "#A5442F" }
                                      : undefined
                                  }
                                >
                                  {formatData(l.proximo_followup)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-muted-foreground">
                              {formatData(l.atualizado_em)}
                              {esfriando && (
                                <span
                                  className="ml-1.5 rounded-sm px-1.5 py-0.5 text-[10px]"
                                  style={{ backgroundColor: "#B58C521f", color: "#B58C52" }}
                                >
                                  esfriando
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </Fragment>
                );
              })}
              {!isLoading && filtrados.length === 0 && (
                <tr>
                  <td colSpan={COLUNAS.length + 1} className="px-3 py-8 text-muted-foreground">
                    Nenhum lead com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LeadDrawer lead={aberto} onOpenChange={(o) => !o && setAberto(null)} />
      <ImportDialog open={importando} onOpenChange={setImportando} leads={leads} />
    </Shell>
  );
}
