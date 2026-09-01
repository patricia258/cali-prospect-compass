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
  "Oi, tudo bem? Patrícia aqui, da CALI RH. Eu estava conhecendo um pouco a [Empresa] e queria só confirmar uma coisa: quem costuma olhar a parte de gestão de pessoas e liderança por aí? Você consegue me passar o contato dessa pessoa?";

export const MENSAGEM_PONTE_MAPA =
  "Entendi. Deixa eu te contar uma coisa: eu desenvolvi uma ferramenta que chama Mapa de People e uso justamente para fazer uma primeira leitura disso sem você precisar me contar a vida inteira da empresa rs.\n\nSe quiser, te mando por aqui. É gratuito, leva uns 7 minutos e no final você recebe um relatório com a leitura completa do cenário.\n\nAcho que pode te ajudar a enxergar essa parte com mais clareza.";

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

/* ---------------------------------------------------------------------------
 * Filas de trabalho A/B/C — regra única, derivada dos campos existentes.
 * ------------------------------------------------------------------------- */

export type Fila = "A" | "B" | "C";

export const FILA_LABELS: Record<Fila, string> = {
  A: "Fila A — abordar agora",
  B: "Fila B — fit forte",
  C: "Fila C — pesquisar/qualificar",
};

export const FILA_CORES: Record<Fila, string> = {
  A: "#5A1E2D",
  B: "#B58C52",
  C: "#8A8078",
};

type LeadFila = {
  icp_fit?: number | null;
  sinal_compra?: string | null;
  sinal_detalhe?: string | null;
  sinal_fonte_url?: string | null;
  status?: string | null;
};

/** Sinal considerado verificado: humano basta detalhe; pesquisado exige detalhe + fonte. */
export function sinalVerificado(lead: LeadFila) {
  const sinal = lead.sinal_compra?.trim();
  if (!sinal || sinal === "Sem sinal forte") return false;
  const detalhe = Boolean(lead.sinal_detalhe?.trim());
  if (!detalhe) return false;
  if (SINAIS_QUENTES.has(sinal)) return true;
  return Boolean(lead.sinal_fonte_url?.trim());
}

export function classificarFila(lead: LeadFila): { fila: Fila; motivo: string } {
  const fit = typeof lead.icp_fit === "number" ? lead.icp_fit : null;

  if (lead.status === "Sem fit / perdido") {
    return { fila: "C", motivo: "C · encerrado como sem fit / perdido" };
  }
  if (fit === null) {
    return { fila: "C", motivo: "C · ainda sem fit validado" };
  }
  if (fit < 7) {
    return { fila: "C", motivo: `C · fit ${fit}, abaixo do corte de 7` };
  }
  if (sinalVerificado(lead)) {
    return { fila: "A", motivo: `A · fit ${fit} + sinal verificado` };
  }
  return { fila: "B", motivo: `B · fit ${fit}, sem sinal verificado` };
}

export function filaDe(lead: LeadFila): Fila {
  return classificarFila(lead).fila;
}

/* ---------------------------------------------------------------------------
 * Rotina comercial — transforma inteligência do lead em ação simples para a Pati.
 * ------------------------------------------------------------------------- */

export type CanalAbordagem =
  | "WhatsApp"
  | "E-mail"
  | "LinkedIn"
  | "Telefone / WhatsApp a validar"
  | "Telefone para roteamento"
  | "E-mail para roteamento"
  | "Pesquisar canal";

type LeadAbordagem = LeadFila & {
  empresa?: string | null;
  categoria?: string | null;
  cidade?: string | null;
  nome_decisor?: string | null;
  cargo_decisor?: string | null;
  email?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  linkedin_decisor?: string | null;
  angulo_abordagem?: string | null;
  prioridade?: string | null;
  primeiro_contato_em?: string | null;
  icp_fit?: number | null;
};

export function canalRecomendado(lead: LeadAbordagem): CanalAbordagem {
  if (lead.whatsapp === "Sim" && lead.telefone) return "WhatsApp";
  if (lead.nome_decisor && lead.email) return "E-mail";
  if (lead.linkedin_decisor) return "LinkedIn";
  if (lead.nome_decisor && lead.telefone) return "Telefone / WhatsApp a validar";
  if (lead.telefone) return "Telefone para roteamento";
  if (lead.email) return "E-mail para roteamento";
  return "Pesquisar canal";
}

function primeiroNome(nome?: string | null) {
  return nome?.trim().split(/\s+/)[0] || "";
}

function contextoOperacao(lead: LeadAbordagem) {
  const categoria = (lead.categoria ?? "").toLowerCase();
  const local = lead.cidade ? ` aí em ${lead.cidade}` : "";
  if (/industr|quim|autom|tecn|software|engenh|metal|fabric/.test(categoria)) {
    return `Vi que vocês têm uma operação bem técnica${local}.`;
  }
  if (/clinic|saude|médic|medic|hospital|laborat/.test(categoria)) {
    return `Eu estava conhecendo um pouco a operação da ${lead.empresa}${local}.`;
  }
  return `Eu estava conhecendo um pouco a ${lead.empresa}${local}.`;
}

export function planoAbordagem(lead: LeadAbordagem) {
  const canal = canalRecomendado(lead);
  const nome = primeiroNome(lead.nome_decisor);
  const empresa = lead.empresa || "empresa";
  const temDecisor = Boolean(lead.nome_decisor?.trim());
  const sinal = lead.sinal_compra || "Sem sinal forte";
  const contexto = contextoOperacao(lead);

  let objetivo = temDecisor
    ? "Confirmar se a gestão de pessoas fica com essa pessoa ou se existe outro responsável."
    : "Descobrir quem é a pessoa responsável por gestão de pessoas antes de vender qualquer coisa.";

  let mensagem = MENSAGEM_ROTEAMENTO.replace("[Empresa]", empresa);
  let assunto: string | null = null;

  if (temDecisor) {
    if (sinal === "Empresa contratando") {
      mensagem = `Oi, ${nome}, tudo bem? Patrícia aqui, da CALI RH.\n\nVi que vocês estão ampliando o time na ${empresa}. Parabéns pelo movimento. Imagino que junto com as contratações venham algumas decisões de gestão de pessoas também.\n\nEssa frente fica com você ou tem alguém que toca a gestão de pessoas por aí?`;
    } else if (sinal === "Crescimento / expansão") {
      mensagem = `Oi, ${nome}, tudo bem? Patrícia aqui, da CALI RH.\n\nVi o movimento de crescimento da ${empresa}. Parabéns — desejo muito sucesso nessa fase. Imagino que junto com a estrutura venham algumas decisões de gestão de pessoas também.\n\nEssa frente fica com você ou tem alguém que toca a gestão de pessoas por aí?`;
    } else if (sinal !== "Sem sinal forte" && lead.sinal_detalhe?.trim()) {
      mensagem = `Oi, ${nome}, tudo bem? Patrícia aqui, da CALI RH.\n\nVi um pouco do movimento recente da ${empresa} e achei que valia te escrever. Eu trabalho aqui em Curitiba e região apoiando empresas na parte de gestão de pessoas e liderança.\n\nMe responde uma coisa: essa frente fica com você ou tem alguém que toca a gestão de pessoas por aí?`;
    } else {
      mensagem = `Oi, ${nome}, tudo bem? Patrícia aqui, da CALI RH. Tô chegando meio do nada mesmo rs.\n\n${contexto} Eu trabalho aqui em Curitiba e região apoiando empresas na parte de gestão de pessoas e liderança.\n\nMe responde uma coisa: essa frente fica com você ou tem alguém que toca a gestão de pessoas por aí?`;
    }
  }

  if (canal === "LinkedIn" && temDecisor) {
    mensagem = `Oi, ${nome}, tudo bem? Patrícia aqui, da CALI RH. Eu estava conhecendo um pouco a ${empresa} e queria te fazer uma pergunta rápida: a frente de gestão de pessoas fica com você ou tem alguém que toca isso por aí?`;
  }

  if (canal === "E-mail" && temDecisor) {
    assunto = `Uma pergunta rápida sobre a ${empresa}`;
    mensagem = `Oi, ${nome}, tudo bem?\n\nPatrícia aqui, da CALI RH. ${contexto} Eu trabalho com empresas de Curitiba e região na parte de gestão de pessoas e liderança.\n\nQueria só confirmar uma coisa: essa frente fica com você ou tem alguém que toca a gestão de pessoas por aí?\n\nAbraço,\nPatrícia`;
  }

  const porQue =
    lead.sinal_detalhe?.trim() ||
    lead.angulo_abordagem?.trim() ||
    (lead.icp_fit ? `Fit ${lead.icp_fit}/10 com o perfil comercial da CALI.` : "Lead qualificado para abordagem.");

  const evitar =
    "Não apresentar a CALI inteira, não mandar PDF/Mapa de People e não perguntar ‘qual seu maior desafio?’ no primeiro contato.";

  return {
    canal,
    falarCom: lead.nome_decisor
      ? `${lead.nome_decisor}${lead.cargo_decisor ? ` · ${lead.cargo_decisor}` : ""}`
      : "Responsável por gestão de pessoas ainda não identificado",
    porQue,
    objetivo,
    evitar,
    assunto,
    mensagem,
    textoCopiar: assunto ? `Assunto: ${assunto}\n\n${mensagem}` : mensagem,
  };
}

const STATUS_PRE_CONTATO = new Set([
  "Novo lead",
  "Enriquecendo dados",
  "Qualificado",
  "Sinal identificado",
]);

export function leadAbordavelHoje(lead: LeadAbordagem) {
  const fila = filaDe(lead);
  if (fila !== "A" && fila !== "B") return false;
  if (!STATUS_PRE_CONTATO.has(lead.status ?? "")) return false;
  if (lead.primeiro_contato_em) return false;
  return prontoParaAbordagem(lead);
}

export function scoreContatoHoje(lead: LeadAbordagem) {
  const fila = filaDe(lead);
  const canal = canalRecomendado(lead);
  const bonusFila = fila === "A" ? 1000 : 500;
  const bonusFit = (lead.icp_fit ?? 0) * 20;
  const bonusPrioridade = lead.prioridade === "Alta" ? 80 : lead.prioridade === "Média" ? 40 : 0;
  const bonusCanal =
    canal === "WhatsApp"
      ? 50
      : canal === "E-mail"
        ? 40
        : canal === "LinkedIn"
          ? 35
          : canal === "Telefone / WhatsApp a validar"
            ? 25
            : 0;
  return bonusFila + bonusFit + bonusPrioridade + bonusCanal;
}