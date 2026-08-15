export const STATUS_LIST = [
  "Não contatado",
  "Mensagem enviada",
  "Respondeu",
  "Reunião agendada",
  "Reunião realizada",
  "Chamada agendada",
  "Proposta enviada",
  "Cliente",
  "Em standby",
  "Desalinhado",
  "Declinou",
  "Sem interesse",
] as const;

export type Status = (typeof STATUS_LIST)[number];

/**
 * Cores de status agrupadas por sinal, conforme definido pela Patrícia:
 * - Não contatado / Mensagem enviada → neutro, sem cor de destaque (ainda não há sinal)
 * - Respondeu / Reunião agendada / Reunião realizada / Chamada agendada → amarelo claro (em conversa)
 * - Proposta enviada / Cliente → verde (resultado positivo)
 * - Em standby → laranja
 * - Desalinhado / Declinou / Sem interesse → vermelho (encerrado sem avanço)
 *
 * `null` significa "sem cor de destaque" — o StatusBadge renderiza neutro nesse caso.
 */
export const STATUS_COLORS: Record<string, string | null> = {
  "Não contatado": null,
  "Mensagem enviada": null,
  Respondeu: "#D8B255",
  "Reunião agendada": "#D8B255",
  "Reunião realizada": "#D8B255",
  "Chamada agendada": "#D8B255",
  "Proposta enviada": "#4C7A52",
  Cliente: "#4C7A52",
  "Em standby": "#C97A3D",
  Desalinhado: "#A5442F",
  Declinou: "#A5442F",
  "Sem interesse": "#A5442F",
};

/** Cor "estrutural" — sempre retorna uma cor, mesmo para status neutros (usada em bordas/kanban). */
export function statusColor(status?: string | null) {
  return STATUS_COLORS[status ?? ""] ?? "#B7A99A";
}

/** Cor "de destaque" — retorna null para status neutros, para o StatusBadge saber quando não colorir. */
export function statusAccent(status?: string | null) {
  return STATUS_COLORS[status ?? ""] ?? null;
}

export const ADERENCIAS = ["Alta", "Média", "Parceria", "Baixa"];
export const SEGMENTOS = ["A", "B", "C", "D"];

export const FUNIL = [
  "Mensagem enviada",
  "Respondeu",
  "Reunião realizada",
  "Proposta enviada",
  "Cliente",
];

export const DIAS_ESFRIANDO = 10;

export const WHATSAPP_OPCOES = ["Não informado", "Sim", "Não"] as const;

/** Normaliza texto livre ("SIM", "NÃO ", "sim", etc.) para um dos valores canônicos. */
export function normalizeWhatsapp(valor?: string | null): string | null {
  if (!valor) return null;
  const v = valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (v.startsWith("sim") || v === "s" || v === "yes" || v === "true") return "Sim";
  if (v.startsWith("nao") || v === "n" || v === "no" || v === "false") return "Não";
  return valor.trim();
}

/** Extrai apenas dígitos de um telefone e garante o prefixo do Brasil (55) para link do WhatsApp. */
export function whatsappLink(telefone?: string | null) {
  if (!telefone) return null;
  const digitos = telefone.replace(/\D/g, "");
  if (!digitos) return null;
  const comPais = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return `https://wa.me/${comPais}`;
}

export function guessSegment(aderencia?: string | null, categoria?: string | null) {
  const ad = (aderencia ?? "").toLowerCase();
  const cat = (categoria ?? "").toLowerCase();
  if (ad.includes("parceria")) return "C";
  if (/tecnolog|software|agenc|digital|startup|saas/.test(cat)) return "B";
  if (
    /industr|fabric|atacad|clinic|saude|policlinic|hospital|laborator|metalurg|moinho|padaria/.test(
      cat,
    )
  )
    return "A";
  return "";
}

export const HEADER_MAP: Record<string, string> = {
  empresa: "empresa",
  aderencia: "aderencia",
  categoria: "categoria",
  website: "website",
  site: "website",
  googlemaps: "google_maps",
  notagoogle: "nota_google",
  navaliacoes: "n_avaliacoes",
  telefone: "telefone",
  whatsapp: "whatsapp",
  email: "email",
  cidade: "cidade",
  linkedindodecisor: "linkedin_decisor",
  linkedin: "linkedin_decisor",
  nomedodecisor: "nome_decisor",
  decisor: "nome_decisor",
  statusdocontato: "status",
  status: "status",
  origem: "origem",
};

export function normalizeHeader(h: string) {
  return h
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** +3 dias úteis a partir de hoje, em ISO (yyyy-mm-dd). */
export function proximosDiasUteis(dias = 3) {
  const d = new Date();
  let restantes = dias;
  while (restantes > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) restantes--;
  }
  return d.toISOString().slice(0, 10);
}

export function diasDesde(iso?: string | null) {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export function formatData(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDataHora(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function preencherModelo(corpo: string, empresa?: string | null, nome?: string | null) {
  return corpo
    .replaceAll("[Empresa]", empresa || "a empresa")
    .replaceAll("[Nome]", (nome || "").split(" ")[0] || "tudo bem");
}
