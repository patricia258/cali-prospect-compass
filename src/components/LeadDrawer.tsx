import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Linkedin,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
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
  CADENCIA_STATUS,
  MENSAGEM_PONTE_MAPA,
  MENSAGEM_ROTEAMENTO,
  ORIGENS,
  PAPEIS_CONTATO,
  PRIORIDADES,
  SEGMENTOS,
  SINAIS_COMPRA,
  STATUS_LIST,
  WHATSAPP_OPCOES,
  formatDataHora,
  pendenciasAbordagem,
  preencherModelo,
  prontoParaAbordagem,
  proximoIntervaloCadencia,
  proximosDiasUteis,
  whatsappLink,
} from "@/lib/cali";
import {
  atualizarLead,
  excluirLead,
  fetchEstrategias,
  fetchEventos,
  registrarEvento,
  type EstrategiaMensagem,
  type Lead,
} from "@/lib/db";

const CAMPOS: { key: keyof Lead; label: string; type?: string }[] = [
  { key: "categoria", label: "Categoria" },
  { key: "cargo_decisor", label: "Cargo do decisor" },
  { key: "cidade", label: "Cidade" },
  { key: "estado", label: "Estado" },
  { key: "nome_decisor", label: "Nome do decisor" },
  { key: "email", label: "E-mail" },
  { key: "telefone", label: "Telefone" },
  { key: "linkedin_decisor", label: "LinkedIn do decisor" },
  { key: "linkedin_empresa", label: "LinkedIn da empresa" },
  { key: "website", label: "Site" },
  { key: "google_maps", label: "Google Maps" },
  { key: "nota_google", label: "Nota Google", type: "number" },
  { key: "n_avaliacoes", label: "Nº de avaliações", type: "number" },
  { key: "tamanho_time", label: "Tamanho do time" },
  { key: "faixa_faturamento", label: "Faixa de faturamento" },
  { key: "pessoas_chave", label: "Pessoas-chave" },
  { key: "estagio_crescimento", label: "Estágio de crescimento" },
  { key: "responsavel", label: "Responsável" },
  { key: "proximo_passo", label: "Próximo passo" },
];

/** Botão de ação rápida — abre em nova aba de verdade (fora do preview do Lovable isso não tem sandbox). */
function AcaoRapida({
  href,
  icon: Icon,
  label,
}: {
  href: string | null;
  icon: typeof Globe;
  label: string;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-dourado/60 bg-dourado/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-dourado hover:text-white"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
}

export function LeadDrawer({
  lead,
  onOpenChange,
}: {
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Lead | null>(lead);
  const [saveState, setSaveState] = useState<"saved" | "pending" | "saving" | "error">("saved");
  const draftRef = useRef<Lead | null>(lead);
  const savedLeadRef = useRef<Lead | null>(lead);
  const pendingRef = useRef<Partial<Lead>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savePromiseRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    draftRef.current = lead;
    savedLeadRef.current = lead;
    pendingRef.current = {};
    setDraft(lead);
    setSaveState("saved");
  }, [lead]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const { data: eventos = [] } = useQuery({
    queryKey: ["eventos", lead?.id],
    queryFn: () => fetchEventos(lead!.id),
    enabled: !!lead,
  });

  const { data: estrategias = [] } = useQuery({
    queryKey: ["estrategias"],
    queryFn: fetchEstrategias,
  });

  const remover = useMutation({
    mutationFn: async () => {
      const salvou = await flushAutoSave();
      if (!salvou) throw new Error("Há alterações pendentes.");
      return excluirLead(lead!.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      onOpenChange(false);
      toast.success("Lead movido para a lixeira.");
    },
    onError: () => toast.error("Não foi possível mover o lead para a lixeira."),
  });

  const estrategiasDoSinal = useMemo(() => {
    const sinal = draft?.sinal_compra || "Sem sinal forte";
    return estrategias.filter((m) => m.sinal === sinal);
  }, [estrategias, draft?.sinal_compra]);

  async function flushAutoSave(): Promise<boolean> {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (savePromiseRef.current) return savePromiseRef.current;

    const base = savedLeadRef.current;
    const patch = pendingRef.current;
    if (!base || Object.keys(patch).length === 0) return true;

    const resultado = { ...base, ...patch };
    if (resultado.status === "Sem fit / perdido" && !resultado.perdido_motivo?.trim()) {
      setSaveState("pending");
      return false;
    }

    pendingRef.current = {};
    setSaveState("saving");

    const leadId = base.id;
    const task = (async () => {
      let sucesso = false;
      try {
        const atualizado = await atualizarLead(base, patch);
        if (savedLeadRef.current?.id !== leadId) return true;

        savedLeadRef.current = atualizado;
        const proximoDraft = { ...atualizado, ...pendingRef.current } as Lead;
        draftRef.current = proximoDraft;
        setDraft(proximoDraft);
        setSaveState(Object.keys(pendingRef.current).length ? "pending" : "saved");
        qc.setQueryData<Lead[]>(["leads"], (atuais) =>
          atuais?.map((item) => (item.id === atualizado.id ? atualizado : item)),
        );
        if (patch.status || patch.notas !== undefined) {
          void qc.invalidateQueries({ queryKey: ["eventos", leadId] });
        }
        sucesso = true;
      } catch {
        if (savedLeadRef.current?.id === leadId) {
          pendingRef.current = { ...patch, ...pendingRef.current };
          setSaveState("error");
          toast.error("Não foi possível salvar automaticamente. Tente novamente.");
        }
      } finally {
        savePromiseRef.current = null;
      }

      if (sucesso && Object.keys(pendingRef.current).length > 0) {
        return flushAutoSave();
      }
      return sucesso;
    })();

    savePromiseRef.current = task;
    return task;
  }

  if (!draft) return null;
  const set = (patch: Partial<Lead>, immediate = false) => {
    const atual = draftRef.current;
    if (!atual) return;

    const proximo = { ...atual, ...patch } as Lead;
    draftRef.current = proximo;
    pendingRef.current = { ...pendingRef.current, ...patch };
    setDraft(proximo);
    setSaveState("pending");

    if (timerRef.current) clearTimeout(timerRef.current);
    if (immediate) {
      void flushAutoSave();
    } else {
      timerRef.current = setTimeout(() => void flushAutoSave(), 700);
    }
  };

  const wa = draft.whatsapp === "Sim" ? whatsappLink(draft.telefone) : null;
  const temAcaoRapida =
    draft.website || draft.google_maps || draft.linkedin_decisor || wa || draft.telefone;
  const pronto = prontoParaAbordagem(draft);
  const pendencias = pendenciasAbordagem(draft);

  function statusChange(novo: string) {
    set({ status: novo }, true);
  }

  async function copiar(corpo: string, estrategia?: EstrategiaMensagem) {
    const texto = preencherModelo(corpo, {
      empresa: draft!.empresa,
      nome: draft!.nome_decisor,
      sinal: draft!.sinal_detalhe,
    });
    await navigator.clipboard.writeText(texto);
    await registrarEvento({
      lead_id: draft!.id,
      tipo: "mensagem_copiada",
      descricao: estrategia
        ? `Toque ${estrategia.toque} copiado: ${estrategia.titulo}.`
        : "Modelo copiado para envio.",
    });
    qc.invalidateQueries({ queryKey: ["eventos", draft!.id] });
    toast.success("Mensagem copiada.");
  }

  async function marcarToqueEnviado(estrategia: EstrategiaMensagem) {
    if (!pronto) {
      toast.error("Complete a pessoa, o sinal e o ângulo antes de iniciar a cadência.");
      return;
    }
    try {
      const salvou = await flushAutoSave();
      if (!salvou) {
        toast.error("Informe o motivo obrigatório antes de continuar.");
        return;
      }
      const ultimo = estrategia.toque >= 4;
      const patch: Partial<Lead> = {
        cadencia_toque: estrategia.toque,
        cadencia_status: ultimo ? "Concluída" : "Ativa",
        modelo_usado: `${estrategia.sinal} · toque ${estrategia.toque}`,
        ultima_interacao: new Date().toISOString(),
        proximo_followup: ultimo
          ? null
          : proximosDiasUteis(proximoIntervaloCadencia(estrategia.toque)),
        status: estrategia.toque === 1 ? "Abordagem enviada" : "Em cadência",
      };
      if (estrategia.toque === 1)
        patch.primeiro_contato_em = draft!.primeiro_contato_em ?? new Date().toISOString();
      const base = savedLeadRef.current ?? draft!;
      const atualizado = await atualizarLead(base, patch);
      savedLeadRef.current = atualizado;
      draftRef.current = atualizado;
      setDraft(atualizado);
      await registrarEvento({
        lead_id: draft!.id,
        tipo: "toque_enviado",
        descricao: `Toque ${estrategia.toque} marcado como enviado: ${estrategia.titulo}.`,
      });
      qc.setQueryData<Lead[]>(["leads"], (atuais) =>
        atuais?.map((item) => (item.id === atualizado.id ? atualizado : item)),
      );
      qc.invalidateQueries({ queryKey: ["eventos", draft!.id] });
      toast.success(ultimo ? "Cadência concluída." : "Próximo toque agendado.");
    } catch {
      toast.error("Não foi possível registrar o envio.");
    }
  }

  return (
    <Sheet
      open={!!lead}
      onOpenChange={(open) => {
        if (open) {
          onOpenChange(true);
          return;
        }
        void flushAutoSave().then((salvou) => {
          if (salvou) onOpenChange(false);
          else if (draftRef.current?.status === "Sem fit / perdido") {
            toast.error("Informe o motivo da perda antes de fechar a ficha.");
          }
        });
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="gap-3 pb-2">
          <SheetTitle className="font-display text-2xl text-primary">{draft.empresa}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <StatusBadge status={draft.status} />
            <span
              className={
                pronto
                  ? "rounded-full bg-[#4C7A521f] px-2 py-0.5 text-xs font-medium text-[#4C7A52]"
                  : "rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
              }
            >
              {pronto ? "Pronto para abordagem" : "Falta contexto para abordar"}
            </span>
            <span className="text-xs text-muted-foreground">
              Última alteração em {formatDataHora(draft.atualizado_em)}
            </span>
            <span
              className={
                saveState === "error"
                  ? "inline-flex items-center gap-1 text-xs text-destructive"
                  : "inline-flex items-center gap-1 text-xs text-muted-foreground"
              }
            >
              {saveState === "saving" ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : saveState === "error" ? (
                <AlertCircle className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {saveState === "saving"
                ? "Salvando…"
                : saveState === "pending"
                  ? "Salvamento automático em instantes"
                  : saveState === "error"
                    ? "Erro ao salvar"
                    : "Salvo automaticamente"}
            </span>
          </SheetDescription>
          {temAcaoRapida && (
            <div className="flex flex-wrap gap-2 pt-1">
              <AcaoRapida href={draft.website} icon={Globe} label="Site" />
              <AcaoRapida href={draft.google_maps} icon={MapPin} label="Maps" />
              <AcaoRapida href={draft.linkedin_decisor} icon={Linkedin} label="LinkedIn" />
              <AcaoRapida href={wa} icon={MessageCircle} label="WhatsApp" />
              <AcaoRapida
                href={draft.telefone ? `tel:${draft.telefone.replace(/\s/g, "")}` : null}
                icon={Phone}
                label="Ligar"
              />
            </div>
          )}
        </SheetHeader>

        <Tabs defaultValue="ficha" className="pb-2">
          <TabsList className="mt-4 w-full border">
            <TabsTrigger value="ficha" className="flex-1">
              Ficha
            </TabsTrigger>
            <TabsTrigger value="mensagens" className="flex-1">
              Estratégia
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
                <Label>Prioridade</Label>
                <Select value={draft.prioridade} onValueChange={(v) => set({ prioridade: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORIDADES.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>ICP fit · 1 a 10</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={draft.icp_fit ?? ""}
                  onChange={(e) => set({ icp_fit: e.target.value ? Number(e.target.value) : null })}
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
              <div className="space-y-1.5">
                <Label>Tem WhatsApp?</Label>
                <Select
                  value={draft.whatsapp || "Não informado"}
                  onValueChange={(v) => set({ whatsapp: v === "Não informado" ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WHATSAPP_OPCOES.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Papel do contato</Label>
                <Select
                  value={draft.papel_contato ?? "__vazio__"}
                  onValueChange={(v) => set({ papel_contato: v === "__vazio__" ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__vazio__">— não definido —</SelectItem>
                    {PAPEIS_CONTATO.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Origem</Label>
                <Select
                  value={
                    ORIGENS.includes(draft.origem as (typeof ORIGENS)[number])
                      ? draft.origem!
                      : "Outro"
                  }
                  onValueChange={(v) => set({ origem: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORIGENS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sinal de compra</Label>
                <Select
                  value={draft.sinal_compra || "Sem sinal forte"}
                  onValueChange={(v) => set({ sinal_compra: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SINAIS_COMPRA.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data do sinal</Label>
                <Input
                  type="date"
                  value={draft.sinal_data ?? ""}
                  onChange={(e) => set({ sinal_data: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cadência</Label>
                <Select
                  value={draft.cadencia_status}
                  onValueChange={(v) => set({ cadencia_status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CADENCIA_STATUS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Detalhe verificável do sinal</Label>
                <Textarea
                  rows={3}
                  value={draft.sinal_detalhe ?? ""}
                  placeholder="Post, vaga, expansão ou fato real que justifica a abordagem"
                  onChange={(e) => set({ sinal_detalhe: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fonte do sinal</Label>
                <Input
                  type="url"
                  value={draft.sinal_fonte_url ?? ""}
                  placeholder="Link do post, vaga, notícia ou página"
                  onChange={(e) => set({ sinal_fonte_url: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Dor provável</Label>
                <Textarea
                  rows={3}
                  value={draft.dor_provavel ?? ""}
                  onChange={(e) => set({ dor_provavel: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ângulo de abordagem</Label>
                <Textarea
                  rows={3}
                  value={draft.angulo_abordagem ?? ""}
                  onChange={(e) => set({ angulo_abordagem: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Objeção identificada</Label>
                <Textarea
                  rows={3}
                  value={draft.objecao ?? ""}
                  onChange={(e) => set({ objecao: e.target.value || null })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Resposta à objeção</Label>
              <Textarea
                rows={3}
                value={draft.resposta_objecao ?? ""}
                onChange={(e) => set({ resposta_objecao: e.target.value || null })}
              />
            </div>

            {draft.status === "Sem fit / perdido" && (
              <div className="space-y-1.5 rounded-md border border-destructive/30 bg-destructive/5 p-4">
                <Label>Motivo da perda · obrigatório</Label>
                <Textarea
                  rows={3}
                  value={draft.perdido_motivo ?? ""}
                  onChange={(e) => set({ perdido_motivo: e.target.value || null })}
                />
              </div>
            )}

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
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tudo o que você altera nesta ficha é salvo automaticamente.
              </p>
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  if (
                    window.confirm("Mover este lead para a lixeira? Ele poderá ser restaurado.")
                  ) {
                    remover.mutate();
                  }
                }}
              >
                Mover para a lixeira
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="mensagens" className="mt-6 space-y-4">
            <div
              className={
                pronto
                  ? "rounded-md border border-dourado/40 bg-dourado/10 p-4 text-sm"
                  : "rounded-md border bg-secondary/50 p-4 text-sm"
              }
            >
              <p className="font-medium text-primary">
                {pronto
                  ? `${draft.sinal_compra} · toque atual ${draft.cadencia_toque}/4`
                  : "Enriquecer antes de abordar"}
              </p>
              {pronto ? (
                <p className="mt-1 text-muted-foreground">
                  Copie, revise e envie manualmente. Quando houver resposta, mude para “Conversa
                  aberta”: a cadência será pausada imediatamente.
                </p>
              ) : (
                <>
                  <p className="mt-1 text-muted-foreground">
                    Não use uma dor presumida como personalização. Complete: {pendencias.join(", ")}
                    .
                  </p>
                  {draft.telefone ? (
                    <div className="mt-4 rounded-md border bg-card p-3">
                      <p className="label-eyebrow">Roteamento · não é abordagem comercial</p>
                      <p className="mt-2 leading-relaxed">
                        {preencherModelo(MENSAGEM_ROTEAMENTO, {
                          empresa: draft.empresa,
                          nome: draft.nome_decisor,
                          sinal: draft.sinal_detalhe,
                        })}
                      </p>
                      <Button
                        className="mt-3"
                        size="sm"
                        variant="outline"
                        onClick={() => copiar(MENSAGEM_ROTEAMENTO)}
                      >
                        Copiar para localizar o decisor
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
            {pronto && !estrategiasDoSinal.length ? (
              <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
                Ainda não há uma cadência cadastrada para este sinal. Não use um modelo genérico:
                registre a mensagem a partir do fato observado.
              </p>
            ) : null}
            {pronto &&
              estrategiasDoSinal.map((m) => {
                const proximoToque = draft.cadencia_toque < 4 ? draft.cadencia_toque + 1 : null;
                const sugerido = m.toque === proximoToque;
                return (
                  <article
                    key={m.id}
                    className={
                      sugerido
                        ? "rounded-md border border-dourado bg-dourado/5 p-4"
                        : "rounded-md border bg-card p-4"
                    }
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="label-eyebrow">
                          Toque {m.toque} · {m.quando_enviar}
                        </p>
                        <h3 className="mt-1 text-base text-primary">{m.titulo}</h3>
                      </div>
                      {sugerido ? (
                        <span className="rounded-full bg-dourado/15 px-2 py-1 text-xs text-primary">
                          Próximo sugerido
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Objetivo: {m.objetivo}</p>
                    <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {preencherModelo(m.corpo, {
                        empresa: draft.empresa,
                        nome: draft.nome_decisor,
                        sinal: draft.sinal_detalhe,
                      })}
                    </pre>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => copiar(m.corpo, m)}>
                        Copiar para revisar
                      </Button>
                      <Button size="sm" disabled={!sugerido} onClick={() => marcarToqueEnviado(m)}>
                        Marcar como enviado
                      </Button>
                    </div>
                  </article>
                );
              })}
            <article className="rounded-md border border-dourado/40 bg-dourado/5 p-4">
              <p className="label-eyebrow">Depois que o lead responder</p>
              <h3 className="mt-1 text-base text-primary">Ponte para o Mapa de People</h3>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {MENSAGEM_PONTE_MAPA}
              </pre>
              <Button
                className="mt-4"
                size="sm"
                variant="outline"
                onClick={() => copiar(MENSAGEM_PONTE_MAPA)}
              >
                Copiar ponte para o Mapa
              </Button>
            </article>
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
