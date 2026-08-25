import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  HEADER_MAP,
  guessSegment,
  normalizeHeader,
  normalizeStatus,
  normalizeWhatsapp,
} from "@/lib/cali";
import { importarLeadsSeguro, type Lead } from "@/lib/db";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type NovoLead = TablesInsert<"leads">;

function rowToLead(row: Record<string, unknown>): NovoLead | null {
  const norm: Record<string, string> = {};
  for (const key of Object.keys(row)) {
    const mapped = HEADER_MAP[normalizeHeader(key)];
    if (!mapped) continue;
    const value = row[key];
    norm[mapped] = value === undefined || value === null ? "" : String(value).trim();
  }
  const g = (k: string) => norm[k] ?? "";
  if (!g("empresa")) return null;

  const nota = parseFloat(g("nota_google").replace(",", "."));
  const avaliacoes = parseInt(g("n_avaliacoes").replace(/\D/g, ""), 10);

  return {
    empresa: g("empresa"),
    aderencia: g("aderencia") || null,
    categoria: g("categoria") || null,
    cargo_decisor: g("cargo_decisor") || null,
    cidade: g("cidade") || null,
    estado: g("estado") || null,
    nome_decisor: g("nome_decisor") || null,
    email: g("email") || null,
    whatsapp: normalizeWhatsapp(g("whatsapp")),
    telefone: g("telefone") || null,
    linkedin_decisor: g("linkedin_decisor") || null,
    linkedin_empresa: g("linkedin_empresa") || null,
    website: g("website") || null,
    google_maps: g("google_maps") || null,
    nota_google: Number.isFinite(nota) ? nota : null,
    n_avaliacoes: Number.isFinite(avaliacoes) ? avaliacoes : null,
    tamanho_time: g("tamanho_time") || null,
    faixa_faturamento: g("faixa_faturamento") || null,
    papel_contato: g("papel_contato") || null,
    icp_fit: g("icp_fit") && Number.isFinite(Number(g("icp_fit"))) ? Number(g("icp_fit")) : null,
    dor_provavel: g("dor_provavel") || null,
    pessoas_chave: g("pessoas_chave") || null,
    estagio_crescimento: g("estagio_crescimento") || null,
    sinal_compra: g("sinal_compra") || "Sem sinal",
    sinal_detalhe: g("sinal_detalhe") || null,
    prioridade: g("prioridade") || "Média",
    responsavel: g("responsavel") || "Patrícia",
    proximo_passo: g("proximo_passo") || null,
    angulo_abordagem: g("angulo_abordagem") || null,
    objecao: g("objecao") || null,
    resposta_objecao: g("resposta_objecao") || null,
    status: normalizeStatus(g("status")),
    origem: g("origem") || "planilha importada",
    segmento: guessSegment(g("aderencia"), g("categoria")) || null,
  };
}

/** Lê a planilha preservando o hyperlink real das células (Site / Google Maps). */
function parseXlsx(buffer: ArrayBuffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames.includes("Leads") ? "Leads" : (wb.SheetNames[0] ?? "");
  const ws = wb.Sheets[sheetName];

  if (!ws || !ws["!ref"]) return [];
  const range = XLSX.utils.decode_range(ws["!ref"]);

  const headers: string[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c })];
    headers[c] = cell ? String(cell.v ?? "").trim() : "";
  }

  const rows: Record<string, unknown>[] = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row: Record<string, unknown> = {};
    let vazia = true;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const header = headers[c];
      if (!header) continue;
      const cell = ws[XLSX.utils.encode_cell({ r, c })] as
        (XLSX.CellObject & { l?: { Target?: string } }) | undefined;
      if (!cell) continue;
      const link = cell.l?.Target;
      const value = link && /^https?:/i.test(link) ? link : (cell.v ?? "");
      if (String(value).trim()) vazia = false;
      row[header] = value;
    }
    if (!vazia) rows.push(row);
  }
  return rows;
}

type Analise = {
  novos: NovoLead[];
  duplicados: { novo: NovoLead; existente: Lead }[];
};

function chaveContato(valor: string | null | undefined, tipo: "email" | "telefone" | "linkedin") {
  const v = (valor ?? "").trim().toLowerCase();
  if (!v) return "";
  if (tipo === "telefone") return v.replace(/\D/g, "");
  return v.replace(/\/$/, "");
}

function analisar(candidatos: NovoLead[], existentes: Lead[]): Analise {
  const porEmpresa = new Map(existentes.map((l) => [l.empresa.trim().toLowerCase(), l]));
  const porContato = new Map<string, Lead>();
  for (const l of existentes) {
    const chaves = [
      chaveContato(l.email, "email"),
      chaveContato(l.telefone, "telefone"),
      chaveContato(l.linkedin_decisor, "linkedin"),
    ];
    chaves.filter(Boolean).forEach((chave) => porContato.set(chave, l));
  }

  const novos: NovoLead[] = [];
  const duplicados: Analise["duplicados"] = [];
  const empresasDoArquivo = new Set<string>();
  for (const c of candidatos) {
    const empresa = c.empresa.trim().toLowerCase();
    if (empresasDoArquivo.has(empresa)) continue;
    empresasDoArquivo.add(empresa);
    const chaves = [
      chaveContato(c.email, "email"),
      chaveContato(c.telefone, "telefone"),
      chaveContato(c.linkedin_decisor, "linkedin"),
    ].filter(Boolean);
    const existente = porEmpresa.get(empresa) ?? chaves.map((k) => porContato.get(k)).find(Boolean);
    if (existente) duplicados.push({ novo: c, existente });
    else novos.push(c);
  }
  return { novos, duplicados };
}

const CAMPOS_COMPLETAVEIS: (keyof NovoLead)[] = [
  "aderencia",
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
  "tamanho_time",
  "faixa_faturamento",
  "papel_contato",
  "icp_fit",
  "dor_provavel",
  "pessoas_chave",
  "estagio_crescimento",
  "sinal_compra",
  "sinal_detalhe",
  "origem",
  "prioridade",
  "responsavel",
  "proximo_passo",
  "angulo_abordagem",
];

function atualizacoesSeguras(duplicados: Analise["duplicados"]) {
  return duplicados.flatMap(({ novo, existente }) => {
    const patch: TablesUpdate<"leads"> = {};
    for (const campo of CAMPOS_COMPLETAVEIS) {
      const atual = existente[campo as keyof Lead];
      const recebido = novo[campo];
      if ((atual === null || atual === "") && recebido !== null && recebido !== "") {
        Object.assign(patch, { [campo]: recebido });
      }
    }
    return Object.keys(patch).length ? [{ id: existente.id, patch }] : [];
  });
}

export function ImportDialog({
  open,
  onOpenChange,
  leads,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
}) {
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [arquivo, setArquivo] = useState<string | null>(null);

  const importar = useMutation({
    mutationFn: async (modo: "somente_novos" | "completar_vazios") => {
      if (!analise) throw new Error("Importação não analisada.");
      const atualizacoes =
        modo === "completar_vazios" ? atualizacoesSeguras(analise.duplicados) : [];
      return importarLeadsSeguro({
        novos: analise.novos,
        atualizacoes,
        existentes: leads,
        arquivo,
        modo,
        duplicados: analise.duplicados.length,
      });
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`${data.novos} novo(s) e ${data.atualizados} cadastro(s) complementado(s).`);
      setTexto("");
      setAnalise(null);
      setArquivo(null);
      onOpenChange(false);
    },
    onError: () => toast.error("Falha ao importar."),
  });

  function processar(rows: Record<string, unknown>[], nomeArquivo?: string) {
    const candidatos = rows.map(rowToLead).filter(Boolean) as NovoLead[];
    if (!candidatos.length) {
      toast.error("Nenhuma linha com coluna Empresa foi encontrada.");
      return;
    }
    setArquivo(nomeArquivo ?? "CSV colado");
    setAnalise(analisar(candidatos, leads));
  }

  function lerArquivo(file: File) {
    const reader = new FileReader();
    const isCsv = /\.csv$/i.test(file.name);
    reader.onload = () => {
      try {
        if (isCsv) {
          const parsed = Papa.parse<Record<string, unknown>>(String(reader.result), {
            header: true,
            skipEmptyLines: true,
          });
          processar(parsed.data, file.name);
        } else {
          processar(parseXlsx(reader.result as ArrayBuffer), file.name);
        }
      } catch {
        toast.error("Não consegui ler esse arquivo. Exporte novamente como .xlsx.");
      }
    };
    if (isCsv) reader.readAsText(file, "utf-8");
    else reader.readAsArrayBuffer(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary">Importar leads</DialogTitle>
          <DialogDescription>
            Envie a planilha (.xlsx, .xls, .csv) ou cole o conteúdo em CSV. A importação nunca apaga
            leads. Antes de qualquer alteração, o sistema guarda uma cópia integral da base.
          </DialogDescription>
        </DialogHeader>

        {!analise ? (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="arquivo">Arquivo</Label>
              <input
                id="arquivo"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="block w-full text-sm file:mr-4 file:rounded-sm file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-foreground"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) lerArquivo(file);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="csv">Ou cole o CSV</Label>
              <Textarea
                id="csv"
                rows={8}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Empresa,Aderência,Categoria,Cidade,E-mail..."
              />
            </div>
            <Button
              onClick={() => {
                if (!texto.trim()) {
                  toast.error("Cole o CSV ou envie um arquivo.");
                  return;
                }
                const parsed = Papa.parse<Record<string, unknown>>(texto.trim(), {
                  header: true,
                  skipEmptyLines: true,
                });
                processar(parsed.data, "CSV colado");
              }}
            >
              Analisar
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md border bg-card p-4">
                <p className="font-display text-2xl text-primary">{analise.novos.length}</p>
                <p className="label-eyebrow mt-1">Leads novos</p>
              </div>
              <div className="rounded-md border bg-card p-4">
                <p className="font-display text-2xl text-primary">{analise.duplicados.length}</p>
                <p className="label-eyebrow mt-1">Possíveis duplicados</p>
              </div>
            </div>

            {analise.duplicados.length > 0 && (
              <div className="max-h-52 overflow-y-auto rounded-md border">
                <ul className="divide-y text-sm">
                  {analise.duplicados.slice(0, 60).map((d, i) => (
                    <li key={i} className="flex flex-wrap gap-x-2 px-3 py-2">
                      <span className="font-medium">{d.novo.empresa}</span>
                      <span className="text-muted-foreground">
                        já cadastrado como “{d.existente.empresa}”
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-md border border-dourado/40 bg-dourado/10 p-4 text-sm">
              <p className="font-medium text-primary">Proteção da base ativa</p>
              <p className="mt-1 text-muted-foreground">
                Nenhuma opção abaixo substitui a base. Status, notas, follow-ups e histórico dos
                leads existentes são preservados.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => importar.mutate("somente_novos")}
                disabled={importar.isPending || analise.novos.length === 0}
              >
                Importar somente novos (recomendado)
              </Button>
              {analise.duplicados.length > 0 && (
                <Button
                  variant="outline"
                  disabled={importar.isPending}
                  onClick={() => importar.mutate("completar_vazios")}
                >
                  Novos + completar campos vazios
                </Button>
              )}
              <Button variant="ghost" onClick={() => setAnalise(null)}>
                Voltar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
