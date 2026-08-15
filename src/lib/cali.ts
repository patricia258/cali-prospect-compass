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

export const STATUS_COLORS: Record<string, string> = {
  "Não contatado": "#B7A99A",
  "Mensagem enviada": "#B58C52",
  Respondeu: "#8AA37F",
  "Reunião agendada": "#5C7A5A",
  "Reunião realizada": "#3F6B52",
  "Chamada agendada": "#5C7A5A",
  "Proposta enviada": "#9C4A4F",
  Cliente: "#5A1E2D",
  "Em standby": "#8A8577",
  Desalinhado: "#B0673E",
  Declinou: "#A5442F",
  "Sem interesse": "#9C9088",
};

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

export function statusColor(status?: string | null) {
  return STATUS_COLORS[status ?? ""] ?? "#B7A99A";
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
