import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Papa from "papaparse";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  SEGMENTOS,
  STATUS_LIST,
  diasDesde,
  formatData,
  statusColor,
} from "@/lib/cali";
import {
  criarLead,
  criarVisao,
  excluirVisao,
  fetchLeads,
  fetchVisoes,
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
  { campo: "aderencia", label: "Aderência" },
  { campo: "segmento", label: "Segmento" },
  { campo: "cidade", label: "Cidade" },
  { campo: "nota_google", label: "Google" },
  { campo: "status", label: "Status" },
  { campo: "proximo_followup", label: "Follow-up" },
  { campo: "atualizado_em", label: "Atualizado" },
];

function Leads() {
  const qc = useQueryClient();
  const { data: leads = [], isLoading } = useQuery({ queryKey: ["leads"], queryFn: fetchLeads });
  const { data: visoes = [] } = useQuery({ queryKey: ["visoes"], queryFn: fetchVisoes });

  const [busca, setBusca] = useState("");
  const [aderencia, setAderencia] = useState("todas");
  const [segmento, setSegmento] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [followupVencido, setFollowupVencido] = useState(false);
  const [agrupar, setAgrupar] = useState(false);
  const [ordem, setOrdem] = useState<Ordem>({ campo: "atualizado_em", dir: "desc" });
  const [aberto, setAberto] = useState<Lead | null>(null);
  const [importando, setImportando] = useState(false);

  const hoje = new Date().toISOString().slice(0, 10);

  const novo = useMutation({
    mutationFn: () => criarLead(),
    onSuccess: (lead) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      setAberto(lead);
    },
  });

  const salvarVisao = useMutation({
    mutationFn: (nome: string) =>
      criarVisao(nome, { aderencia, segmento, status, busca, followupVencido }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visoes"] });
      toast.success("Visão salva.");
    },
  });

  const removerVisao = useMutation({
    mutationFn: (id: string) => excluirVisao(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visoes"] }),
  });

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = leads.filter((l) => {
      if (aderencia !== "todas" && (l.aderencia ?? "") !== aderencia) return false;
      if (segmento !== "todos") {
        if (segmento === "__vazio__" ? !!l.segmento : l.segmento !== segmento) return false;
      }
      if (status !== "todos" && l.status !== status) return false;
      if (followupVencido && !(l.proximo_followup && l.proximo_followup < hoje)) return false;
      if (!termo) return true;
      return [l.empresa, l.categoria, l.cidade, l.nome_decisor, l.email, l.notas, ...(l.tags ?? [])]
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
  }, [leads, busca, aderencia, segmento, status, followupVencido, ordem, hoje]);

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
      "categoria",
      "cidade",
      "nome_decisor",
      "email",
      "whatsapp",
      "telefone",
      "linkedin_decisor",
      "website",
      "google_maps",
      "nota_google",
      "n_avaliacoes",
      "status",
      "proximo_followup",
      "origem",
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
    setBusca((filtros["busca"] as string) ?? "");
    setFollowupVencido(Boolean(filtros["followupVencido"]));
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
          <Button onClick={() => novo.mutate()}>Novo lead</Button>
        </>
      }
    >
      <div className="space-y-4">
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
          <div className="flex items-center gap-2">
            <Switch
              id="vencido"
              checked={followupVencido}
              onCheckedChange={setFollowupVencido}
            />
            <Label htmlFor="vencido" className="text-xs">
              Follow-up vencido
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
                {COLUNAS.map((c) => (
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
                  <td colSpan={COLUNAS.length} className="px-3 py-6 text-muted-foreground">
                    Carregando…
                  </td>
                </tr>
              )}
              {grupos.map((g) => (
                <>
                  {g.titulo && (
                    <tr key={`h-${g.titulo}`} className="bg-secondary/60">
                      <td colSpan={COLUNAS.length} className="px-3 py-1.5">
                        <span className="flex items-center gap-2 text-xs font-semibold">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: statusColor(g.titulo) }}
                          />
                          {g.titulo}
                          <span className="text-muted-foreground">({g.itens.length})</span>
                        </span>
                      </td>
                    </tr>
                  )}
                  {g.itens.map((l) => {
                    const vencido = !!l.proximo_followup && l.proximo_followup < hoje;
                    const esfriando = diasDesde(l.atualizado_em) > DIAS_ESFRIANDO;
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
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {l.aderencia ?? "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          {l.segmento ? (
                            l.segmento
                          ) : (
                            <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                              definir
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{l.cidade ?? "—"}</td>
                        <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                          {l.nota_google ?? "—"}
                          {l.n_avaliacoes ? ` (${l.n_avaliacoes})` : ""}
                        </td>
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
                </>
              ))}
              {!isLoading && filtrados.length === 0 && (
                <tr>
                  <td colSpan={COLUNAS.length} className="px-3 py-8 text-muted-foreground">
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
