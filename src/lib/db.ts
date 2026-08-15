import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Lead = Tables<"leads">;
export type LeadEvento = Tables<"lead_eventos">;
export type Modelo = Tables<"modelos_mensagem">;
export type Visao = Tables<"visoes_salvas">;

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
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
    .insert({ empresa: "Nova empresa", status: "Não contatado", ...patch })
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
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
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

export async function fetchVisoes(): Promise<Visao[]> {
  const { data, error } = await supabase.from("visoes_salvas").select("*").order("criado_em");
  if (error) throw error;
  return data ?? [];
}

export async function criarVisao(nome: string, filtros: Record<string, unknown>) {
  const { error } = await supabase.from("visoes_salvas").insert({ nome, filtros });
  if (error) throw error;
}

export async function excluirVisao(id: string) {
  const { error } = await supabase.from("visoes_salvas").delete().eq("id", id);
  if (error) throw error;
}
