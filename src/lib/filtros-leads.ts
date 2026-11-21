/** Busca em português: acentos e caixa não devem esconder um cadastro. */
export function normalizarBusca(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Lotes antigos podem ter somente seleção; visões antigas também usam etiquetas livres. */
export function correspondePesquisa(tags: string[] | null | undefined, pesquisa: string) {
  return (tags ?? []).some(
    (tag) =>
      tag === `pesquisa-dia-${pesquisa}` || tag === `selecao-dia-${pesquisa}` || tag === pesquisa,
  );
}
