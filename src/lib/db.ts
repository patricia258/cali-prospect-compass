import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Lead = Tables<"leads">;
export type LeadEvento = Tables<"lead_eventos">;
export type Modelo = Tables<"modelos_mensagem">;
export type Visao = Tables<"visoes_salvas">;
export type EstrategiaMensagem = Tables<"estrategias_mensagem">;
export type ImportacaoLeads = Tables<"importacoes_leads">;

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .is("excluido_em", null)
    .order("atualizado_em", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchEventos(leadId: string): Promise<LeadEvento[]> {
  const { data, error } = await supabase
    .from("lead_eventos")
    .select("*")
    .eq("lead_id", leadId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function registrarEvento(evento: TablesInsert<"lead_eventos">) {
  const { error } = await supabase.from("lead_eventos").insert(evento);
  if (error) throw error;
}

export async function atualizarLead(lead: Lead, patch: Partial<Lead>) {
  const { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", lead.id)
    .select()
    .single();
  if (error) throw error;

  if (patch.status && patch.status !== lead.status) {
    await registrarEvento({
      lead_id: lead.id,
      tipo: "status_alterado",
      descricao: `Status alterado de ${lead.status} para ${patch.status}.`,
      status_anterior: lead.status,
      status_novo: patch.status,
    });
  }
  if (patch.notas !== undefined && patch.notas !== lead.notas) {
    await registrarEvento({
      lead_id: lead.id,
      tipo: "nota_adicionada",
      descricao: "Nota atualizada.",
    });
  }
  return data;
}

export async function criarLead(patch: Partial<TablesInsert<"leads">> = {}) {
  const { data, error } = await supabase
    .from("leads")
    .insert({ empresa: "Nova empresa", status: "Novo lead", ...patch })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function criarLeads(rows: TablesInsert<"leads">[]) {
  if (!rows.length) return [];
  const { data, error } = await supabase.from("leads").insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

export async function excluirLead(id: string) {
  const { error } = await supabase
    .from("leads")
    .update({ excluido_em: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  await registrarEvento({
    lead_id: id,
    tipo: "lead_arquivado",
    descricao: "Lead movido para a lixeira. O registro não foi apagado do banco.",
  });
}

export async function fetchLeadsExcluidos(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .not("excluido_em", "is", null)
    .order("excluido_em", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function restaurarLead(id: string) {
  const { error } = await supabase.from("leads").update({ excluido_em: null }).eq("id", id);
  if (error) throw error;
  await registrarEvento({
    lead_id: id,
    tipo: "lead_restaurado",
    descricao: "Lead restaurado da lixeira.",
  });
}

export async function importarLeadsSeguro({
  novos,
  atualizacoes,
  existentes,
  arquivo,
  modo,
  duplicados,
}: {
  novos: TablesInsert<"leads">[];
  atualizacoes: { id: string; patch: TablesUpdate<"leads"> }[];
  existentes: Lead[];
  arquivo?: string | null;
  modo: "somente_novos" | "completar_vazios";
  duplicados: number;
}) {
  const { error: backupError } = await supabase.from("importacoes_leads").insert({
    arquivo: arquivo ?? null,
    modo,
    total_anterior: existentes.length,
    novos: novos.length,
    atualizados: atualizacoes.length,
    ignorados: Math.max(0, duplicados - atualizacoes.length),
    snapshot: existentes as unknown as Json,
  });
  if (backupError) throw backupError;

  if (novos.length) {
    const { error } = await supabase.from("leads").insert(novos);
    if (error) throw error;
  }

  for (let i = 0; i < atualizacoes.length; i += 20) {
    const lote = atualizacoes.slice(i, i + 20);
    await Promise.all(
      lote.map(async ({ id, patch }) => {
        const { error } = await supabase.from("leads").update(patch).eq("id", id);
        if (error) throw error;
      }),
    );
  }

  return { novos: novos.length, atualizados: atualizacoes.length };
}

export async function fetchModelos(): Promise<Modelo[]> {
  const { data, error } = await supabase
    .from("modelos_mensagem")
    .select("*")
    .order("segmento")
    .order("canal");
  if (error) throw error;
  return data ?? [];
}

export async function salvarModelo(id: string, corpo: string) {
  const { error } = await supabase.from("modelos_mensagem").update({ corpo }).eq("id", id);
  if (error) throw error;
}

export async function fetchEstrategias(): Promise<EstrategiaMensagem[]> {
  const { data, error } = await supabase
    .from("estrategias_mensagem")
    .select("*")
    .eq("ativo", true)
    .order("sinal")
    .order("toque");
  if (error) throw error;
  return data ?? [];
}

export async function salvarEstrategia(id: string, corpo: string) {
  const { error } = await supabase.from("estrategias_mensagem").update({ corpo }).eq("id", id);
  if (error) throw error;
}

export async function fetchVisoes(): Promise<Visao[]> {
  const { data, error } = await supabase.from("visoes_salvas").select("*").order("criado_em");
  if (error) throw error;
  return data ?? [];
}

export async function criarVisao(nome: string, filtros: Record<string, unknown>) {
  const { error } = await supabase
    .from("visoes_salvas")
    .insert({ nome, filtros: filtros as never });
  if (error) throw error;
}

export async function excluirVisao(id: string) {
  const { error } = await supabase.from("visoes_salvas").delete().eq("id", id);
  if (error) throw error;
}
