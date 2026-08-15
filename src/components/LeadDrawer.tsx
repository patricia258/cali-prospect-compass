import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ADERENCIAS,
  SEGMENTOS,
  STATUS_LIST,
  formatData,
  formatDataHora,
  preencherModelo,
  proximosDiasUteis,
} from "@/lib/cali";
import {
  atualizarLead,
  excluirLead,
  fetchEventos,
  fetchModelos,
  registrarEvento,
  type Lead,
} from "@/lib/db";

const CAMPOS: { key: keyof Lead; label: string; type?: string }[] = [
  { key: "categoria", label: "Categoria" },
  { key: "cidade", label: "Cidade" },
  { key: "nome_decisor", label: "Nome do decisor" },
  { key: "email", label: "E-mail" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "telefone", label: "Telefone" },
  { key: "linkedin_decisor", label: "LinkedIn do decisor" },
  { key: "website", label: "Site" },
  { key: "google_maps", label: "Google Maps" },
  { key: "nota_google", label: "Nota Google", type: "number" },
  { key: "n_avaliacoes", label: "Nº de avaliações", type: "number" },
  { key: "origem", label: "Origem" },
];

export function LeadDrawer({
  lead,
  onOpenChange,
}: {
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Lead | null>(lead);

  useEffect(() => setDraft(lead), [lead]);

  const { data: eventos = [] } = useQuery({
    queryKey: ["eventos", lead?.id],
    queryFn: () => fetchEventos(lead!.id),
    enabled: !!lead,
  });

  const { data: modelos = [] } = useQuery({ queryKey: ["modelos"], queryFn: fetchModelos });

  const salvar = useMutation({
    mutationFn: (patch: Partial<Lead>) => atualizarLead(lead!, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["eventos", lead?.id] });
      toast.success("Lead atualizado.");
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  const remover = useMutation({
    mutationFn: () => excluirLead(lead!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      onOpenChange(false);
      toast.success("Lead removido.");
    },
  });

  const modelosDoSegmento = useMemo(
    () => modelos.filter((m) => m.segmento === (draft?.segmento ?? "")),
    [modelos, draft?.segmento],
  );

  if (!draft) return null;
  const set = (patch: Partial<Lead>) => setDraft({ ...draft, ...patch });

  function statusChange(novo: string) {
    const patch: Partial<Lead> = { status: novo };
    if (novo === "Mensagem enviada" && !draft!.proximo_followup) {
      patch.proximo_followup = proximosDiasUteis(3);
    }
    set(patch);
  }

  async function copiar(corpo: string) {
    const texto = preencherModelo(corpo, draft!.empresa, draft!.nome_decisor);
    await navigator.clipboard.writeText(texto);
    await registrarEvento({
      lead_id: draft!.id,
      tipo: "mensagem_enviada",
      descricao: "Modelo copiado para envio.",
    });
    qc.invalidateQueries({ queryKey: ["eventos", draft!.id] });
    toast.success("Mensagem copiada.");
  }

  return (
    <Sheet open={!!lead} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="gap-2">
          <SheetTitle className="font-display text-2xl text-primary">
            {draft.empresa}
          </SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <StatusBadge status={draft.status} />
            <span className="text-xs text-muted-foreground">
              Atualizado em {formatData(draft.atualizado_em)}
            </span>
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="ficha" className="px-4 pb-8">
          <TabsList className="w-full">
            <TabsTrigger value="ficha" className="flex-1">
              Ficha
            </TabsTrigger>
            <TabsTrigger value="mensagens" className="flex-1">
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex-1">
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ficha" className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Input value={draft.empresa} onChange={(e) => set({ empresa: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={draft.status} onValueChange={statusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_LIST.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Próximo follow-up</Label>
                <Input
                  type="date"
                  value={draft.proximo_followup ?? ""}
                  onChange={(e) => set({ proximo_followup: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Aderência</Label>
                <Select
                  value={draft.aderencia ?? "__vazio__"}
                  onValueChange={(v) => set({ aderencia: v === "__vazio__" ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__vazio__">— não definida —</SelectItem>
                    {ADERENCIAS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Segmento</Label>
                <Select
                  value={draft.segmento || "__vazio__"}
                  onValueChange={(v) => set({ segmento: v === "__vazio__" ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__vazio__">— definir segmento —</SelectItem>
                    {SEGMENTOS.map((s) => (
                      <SelectItem key={s} value={s}>
                        Segmento {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Etiquetas</Label>
              <Input
                value={(draft.tags ?? []).join(", ")}
                placeholder="voltar depois do verão, indicação da Kirsten"
                onChange={(e) =>
                  set({
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {CAMPOS.map((c) => (
                <div key={c.key} className="space-y-1.5">
                  <Label>{c.label}</Label>
                  <Input
                    type={c.type ?? "text"}
                    value={(draft[c.key] as string | number | null) ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      set({
                        [c.key]:
                          c.type === "number" ? (raw === "" ? null : Number(raw)) : raw || null,
                      } as Partial<Lead>);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea
                rows={5}
                value={draft.notas ?? ""}
                onChange={(e) => set({ notas: e.target.value })}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <Button
                onClick={() => {
                  const { id, criado_em, atualizado_em, ...patch } = draft;
                  void id;
                  void criado_em;
                  void atualizado_em;
                  salvar.mutate(patch);
                }}
                disabled={salvar.isPending}
              >
                Salvar alterações
              </Button>
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => remover.mutate()}
              >
                Excluir lead
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="mensagens" className="mt-6 space-y-4">
            {!draft.segmento ? (
              <p className="text-sm text-muted-foreground">
                Defina um segmento na ficha para ver os modelos sugeridos.
              </p>
            ) : (
              modelosDoSegmento.map((m) => (
                <article key={m.id} className="rounded-md border bg-card p-4">
                  <p className="label-eyebrow">{m.titulo}</p>
                  <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {preencherModelo(m.corpo, draft.empresa, draft.nome_decisor)}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => copiar(m.corpo)}
                  >
                    Copiar
                  </Button>
                </article>
              ))
            )}
          </TabsContent>

          <TabsContent value="historico" className="mt-6">
            {eventos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
            ) : (
              <ol className="relative space-y-5 border-l pl-5">
                {eventos.map((ev) => (
                  <li key={ev.id} className="relative">
                    <span
                      className="absolute -left-[1.4rem] top-1.5 h-2 w-2 rounded-full"
                      style={{ backgroundColor: "var(--dourado)" }}
                    />
                    <p className="text-sm">{ev.descricao ?? ev.tipo}</p>
                    <p className="label-eyebrow mt-1">{formatDataHora(ev.criado_em)}</p>
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
