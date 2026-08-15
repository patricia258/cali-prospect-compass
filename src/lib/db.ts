import { supabase } from "@/integrations/supabase/client";

export type Lead = {
  id: string;
  empresa: string;
  aderencia: string | null;
  segmento: string | null;
  categoria: string | null;
  cidade: string | null;
  nome_decisor: string | null;
  email: string | null;
  whatsapp: string | null;
  telefone: string | null;
  linkedin_decisor: string | null;
  website: string | null;
  google_maps: string | null;
  nota_google: number | null;
  n_avaliacoes: number | null;
  status: string;
  notas: string | null;
  proximo_followup: string | null;
  tags: string[];
  origem: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type LeadEvento = {
  id: string;
  lead_id: string;
  tipo: string;
  descricao: string | null;
  status_anterior: string | null;
  status_novo: string | null;
  criado_em: string;
};

export type Modelo = {
  id: string;
  segmento: string;
  canal: string;
  titulo: string;
  corpo: string;
};

export type Visao = {
  id: string;
  nome: string;
  filtros: Record<string, unknown>;
};

const db = () => supabase as never as ReturnType<typeof supabase.from> extends never ? never : typeof supabase;

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await db()
    .from("leads")
    .select("*")
    .order("atualizado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Lead[];
}

export async function fetchEventos(leadId: string): Promise<LeadEvento[]> {
  const { data, error } = await db()
    .from("lead_eventos")
    .select("*")
    .eq("lead_id", leadId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LeadEvento[];
}

export async function registrarEvento(evento: {
  lead_id: string;
  tipo: string;
  descricao?: string | null;
  status_anterior?: string | null;
  status_novo?: string | null;
}) {
  const { error } = await db().from("lead_eventos").insert(evento as never);
  if (error) throw error;
}

export async function atualizarLead(lead: Lead, patch: Partial<Lead>) {
  const { data, error } = await db()
    .from("leads")
    .update(patch as never)
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
  return data as unknown as Lead;
}

export async function criarLead(patch: Partial<Lead> = {}) {
  const { data, error } = await db()
    .from("leads")
    .insert({ empresa: "Nova empresa", status: "Não contatado", ...patch } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Lead;
}

export async function criarLeads(rows: Partial<Lead>[]) {
  if (!rows.length) return [];
  const { data, error } = await db()
    .from("leads")
    .insert(rows as never)
    .select();
  if (error) throw error;
  return (data ?? []) as unknown as Lead[];
}

export async function excluirLead(id: string) {
  const { error } = await db().from("leads").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchModelos(): Promise<Modelo[]> {
  const { data, error } = await db()
    .from("modelos_mensagem")
    .select("*")
    .order("segmento")
    .order("canal");
  if (error) throw error;
  return (data ?? []) as unknown as Modelo[];
}

export async function salvarModelo(id: string, corpo: string) {
  const { error } = await db()
    .from("modelos_mensagem")
    .update({ corpo } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function fetchVisoes(): Promise<Visao[]> {
  const { data, error } = await db()
    .from("visoes_salvas")
    .select("*")
    .order("criado_em");
  if (error) throw error;
  return (data ?? []) as unknown as Visao[];
}

export async function criarVisao(nome: string, filtros: Record<string, unknown>) {
  const { error } = await db()
    .from("visoes_salvas")
    .insert({ nome, filtros } as never);
  if (error) throw error;
}

export async function excluirVisao(id: string) {
  const { error } = await db().from("visoes_salvas").delete().eq("id", id);
  if (error) throw error;
}
