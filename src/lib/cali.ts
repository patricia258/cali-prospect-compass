export const STATUS_LIST = [
  "Novo lead",
  "Enriquecendo dados",
  "Qualificado",
  "Sinal identificado",
  "Abordagem enviada",
  "Em cadência",
  "Conversa aberta",
  "Diagnóstico agendado",
  "Mapa de People enviado/realizado",
  "Proposta enviada",
  "Negociação",
  "Cliente",
  "Sem fit / perdido",
] as const;

export type Status = (typeof STATUS_LIST)[number];

/**
 * Cores do pipeline orientado por estratégia:
 * - início e enriquecimento → neutros
 * - qualificação e sinal → dourado
 * - cadência → laranja
 * - conversa e diagnóstico → amarelo/verde suave
 * - proposta, negociação e cliente → verde
 * - sem fit / perdido → vermelho
 *
 * `null` significa "sem cor de destaque" — o StatusBadge renderiza neutro nesse caso.
 */
export const STATUS_COLORS: Record<string, string | null> = {
  "Novo lead": "#6B6259",
  "Enriquecendo dados": "#7A6A57",
  Qualificado: "#9A6B18",
  "Sinal identificado": "#B07406",
  "Abordagem enviada": "#B45309",
  "Em cadência": "#C2410C",
  "Conversa aberta": "#A16207",
  "Diagnóstico agendado": "#2F6F4E",
  "Mapa de People enviado/realizado": "#1F6F5C",
  "Proposta enviada": "#15803D",
  Negociação: "#0F766E",
  Cliente: "#166534",
  "Sem fit / perdido": "#991B1B",
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
export const PRIORIDADES = ["Alta", "Média", "Baixa"] as const;
export const PAPEIS_CONTATO = ["Decisor", "Influenciador", "Outro"] as const;
export const ORIGENS = [
  "Indicação",
  "LinkedIn",
  "Instagram",
  "Site",
  "Evento",
  "Lista",
  "Inbound",
  "Outro",
] as const;
export const SINAIS_COMPRA = [
  "Engajou em conteúdo",
  "Visitou perfil",
  "Empresa contratando",
  "Crescimento / expansão",
  "Novo cargo",
  "Postou sobre a dor",
  "Indicação",
  "Operação técnica",
  "Sem sinal forte",
] as const;
export const SINAIS_QUENTES = new Set(["Engajou em conteúdo", "Visitou perfil", "Indicação"]);
export const CADENCIA_STATUS = [
  "Não iniciada",
  "Ativa",
  "Pausada por resposta",
  "Concluída",
] as const;

export const CADENCIA = [
  { toque: 1, nome: "Abertura pelo sinal", quando: "Dia 1", objetivo: "Abrir conexão" },
  {
    toque: 2,
    nome: "Insight útil",
    quando: "Dia 3–4",
    objetivo: "Abrir conversa",
  },
  { toque: 3, nome: "Pergunta diagnóstica", quando: "Dia 7", objetivo: "Diagnosticar" },
  { toque: 4, nome: "Convite claro", quando: "Dia 10–14", objetivo: "Agendar 20 minutos" },
] as const;

export const MENSAGEM_ROTEAMENTO =
  "Oi! Tudo bem? Sou Patrícia Lima. Você consegue me dizer quem cuida das decisões sobre estrutura do time e desenvolvimento das lideranças na [Empresa]? Obrigada.";

export const MENSAGEM_PONTE_MAPA =
  "Entendi. É justamente para trazer clareza sobre esse tipo de situação que criamos o Mapa de People.\n\nEle identifica o que já funciona, os riscos para o crescimento e as prioridades mais adequadas ao momento da empresa — sem recomendar uma estrutura maior do que vocês precisam.";

export const FUNIL = [
  "Abordagem enviada",
  "Conversa aberta",
  "Diagnóstico agendado",
  "Mapa de People enviado/realizado",
  "Proposta enviada",
  "Cliente",
];

export const DIAS_ESFRIANDO = 10;

export const WHATSAPP_OPCOES = ["Não informado", "Sim", "Não"] as const;

const STATUS_ANTERIOR_PARA_ATUAL: Record<string, string> = {
  "Não contatado": "Novo lead",
  "Mensagem enviada": "Abordagem enviada",
  Respondeu: "Conversa aberta",
  "Reunião agendada": "Diagnóstico agendado",
  "Chamada agendada": "Diagnóstico agendado",
  "Reunião realizada": "Mapa de People enviado/realizado",
  "Em standby": "Em cadência",
  Desalinhado: "Sem fit / perdido",
  Declinou: "Sem fit / perdido",
  "Sem interesse": "Sem fit / perdido",
};

export function normalizeStatus(valor?: string | null) {
  const status = valor?.trim();
  if (!status) return "Novo lead";
  return STATUS_ANTERIOR_PARA_ATUAL[status] ?? status;
}

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
  cargo: "cargo_decisor",
  cargododecisor: "cargo_decisor",
  estado: "estado",
  uf: "estado",
  linkedindaempresa: "linkedin_empresa",
  tamanhodotime: "tamanho_time",
  numerodefuncionarios: "tamanho_time",
  faixadefaturamento: "faixa_faturamento",
  papelnocontato: "papel_contato",
  icpfit: "icp_fit",
  dorprovavel: "dor_provavel",
  pessoaschave: "pessoas_chave",
  estagiodecrescimento: "estagio_crescimento",
  sinal: "sinal_compra",
  sinaldecompra: "sinal_compra",
  detalhedosinal: "sinal_detalhe",
  fontedosinal: "sinal_fonte_url",
  linksinal: "sinal_fonte_url",
  urldosinal: "sinal_fonte_url",
  prioridade: "prioridade",
  responsavel: "responsavel",
  proximopasso: "proximo_passo",
  angulodeabordagem: "angulo_abordagem",
  objecao: "objecao",
  respostaaobjecao: "resposta_objecao",
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

export function proximoIntervaloCadencia(toqueAtual: number) {
  if (toqueAtual <= 1) return 2;
  if (toqueAtual === 2) return 3;
  return 4;
}

export function temCanalContato(lead: {
  email?: string | null;
  telefone?: string | null;
  linkedin_decisor?: string | null;
  whatsapp?: string | null;
}) {
  return Boolean(lead.email || lead.telefone || lead.linkedin_decisor || lead.whatsapp === "Sim");
}

export function prontoParaAbordagem(lead: {
  empresa?: string | null;
  nome_decisor?: string | null;
  angulo_abordagem?: string | null;
  sinal_compra?: string | null;
  sinal_detalhe?: string | null;
  email?: string | null;
  telefone?: string | null;
  linkedin_decisor?: string | null;
  whatsapp?: string | null;
}) {
  return pendenciasAbordagem(lead).length === 0;
}

export function pendenciasAbordagem(lead: {
  empresa?: string | null;
  nome_decisor?: string | null;
  angulo_abordagem?: string | null;
  sinal_compra?: string | null;
  sinal_detalhe?: string | null;
  email?: string | null;
  telefone?: string | null;
  linkedin_decisor?: string | null;
  whatsapp?: string | null;
}) {
  const pendencias: string[] = [];
  if (!lead.empresa?.trim()) pendencias.push("empresa");
  if (!lead.nome_decisor?.trim()) pendencias.push("nome do decisor");
  if (!temCanalContato(lead)) pendencias.push("canal de contato");
  if (!lead.sinal_compra) pendencias.push("contexto da abordagem");
  if (lead.sinal_compra === "Sem sinal forte") {
    if (!lead.angulo_abordagem?.trim()) pendencias.push("ângulo de abordagem");
  } else if (lead.sinal_compra && !lead.sinal_detalhe?.trim()) {
    pendencias.push("detalhe verificável do sinal");
  }
  if (!lead.angulo_abordagem?.trim() && !lead.sinal_detalhe?.trim()) {
    pendencias.push("ângulo ou contexto registrado");
  }
  return pendencias;
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

export function preencherModelo(
  corpo: string,
  dados: {
    empresa?: string | null;
    nome?: string | null;
    sinal?: string | null;
  },
) {
  return corpo
    .replaceAll("[Empresa]", dados.empresa || "a empresa")
    .replaceAll("[Nome]", (dados.nome || "").split(" ")[0] || "tudo bem")
    .replaceAll("[Sinal]", dados.sinal || "o movimento que vocês anunciaram");
}
