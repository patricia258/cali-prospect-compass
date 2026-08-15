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
import { HEADER_MAP, guessSegment, normalizeHeader, normalizeWhatsapp } from "@/lib/cali";
import { criarLeads, type Lead } from "@/lib/db";
import type { TablesInsert } from "@/integrations/supabase/types";

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
    cidade: g("cidade") || null,
    nome_decisor: g("nome_decisor") || null,
    email: g("email") || null,
    whatsapp: normalizeWhatsapp(g("whatsapp")),
    telefone: g("telefone") || null,
    linkedin_decisor: g("linkedin_decisor") || null,
    website: g("website") || null,
    google_maps: g("google_maps") || null,
    nota_google: Number.isFinite(nota) ? nota : null,
    n_avaliacoes: Number.isFinite(avaliacoes) ? avaliacoes : null,
    status: g("status") || "Não contatado",
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
        | (XLSX.CellObject & { l?: { Target?: string } })
        | undefined;
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

function analisar(candidatos: NovoLead[], existentes: Lead[]): Analise {
  const porEmpresa = new Map(existentes.map((l) => [l.empresa.trim().toLowerCase(), l]));
  const porContato = new Map<string, Lead>();
  for (const l of existentes) {
    for (const v of [l.email, l.whatsapp, l.telefone]) {
      const chave = (v ?? "").replace(/\D/g, "") || (v ?? "").toLowerCase();
      if (chave) porContato.set(chave, l);
    }
  }

  const novos: NovoLead[] = [];
  const duplicados: Analise["duplicados"] = [];
  for (const c of candidatos) {
    const chaves = [c.email, c.whatsapp, c.telefone]
      .map((v) => (v ?? "").replace(/\D/g, "") || (v ?? "").toLowerCase())
      .filter(Boolean);
    const existente =
      porEmpresa.get(c.empresa.trim().toLowerCase()) ??
      chaves.map((k) => porContato.get(k)).find(Boolean);
    if (existente) duplicados.push({ novo: c, existente });
    else novos.push(c);
  }
  return { novos, duplicados };
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

  const importar = useMutation({
    mutationFn: async (rows: NovoLead[]) => criarLeads(rows),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`${data.length} lead(s) importado(s).`);
      setTexto("");
      setAnalise(null);
      onOpenChange(false);
    },
    onError: () => toast.error("Falha ao importar."),
  });

  function processar(rows: Record<string, unknown>[]) {
    const candidatos = rows.map(rowToLead).filter(Boolean) as NovoLead[];
    if (!candidatos.length) {
      toast.error("Nenhuma linha com coluna Empresa foi encontrada.");
      return;
    }
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
          processar(parsed.data);
        } else {
          processar(parseXlsx(reader.result as ArrayBuffer));
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
            Envie a planilha (.xlsx, .xls, .csv) ou cole o conteúdo em CSV. No .xlsx o link real
            de Site e Google Maps é lido do hyperlink da célula.
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
                processar(parsed.data);
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

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => importar.mutate(analise.novos)}
                disabled={importar.isPending || analise.novos.length === 0}
              >
                Importar só os novos
              </Button>
              {analise.duplicados.length > 0 && (
                <Button
                  variant="outline"
                  disabled={importar.isPending}
                  onClick={() =>
                    importar.mutate([...analise.novos, ...analise.duplicados.map((d) => d.novo)])
                  }
                >
                  Importar tudo, inclusive duplicados
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
