# Status dos leads e regras para a pesquisa diária

Vale para qualquer pessoa ou IA (Claude, ChatGPT/Codex) que alimente o Prospect Compass.

## Status (13)

| Status | Quando usar |
|---|---|
| Novo lead | Entrou na base; pesquisa ainda incompleta (substitui "Enriquecendo dados") |
| Qualificado | Decisor, canal, site, telefone, porte e contexto verificados — pronto para abordar |
| Convite enviado | Convite de conexão enviado no LinkedIn, ainda não aceito. **Não conta como contato feito**; follow-up automático em ~5 dias úteis para checar se aceitou |
| Abordagem enviada | Primeira mensagem enviada |
| Em cadência | Follow-ups em andamento |
| Conversa aberta | O lead respondeu |
| Diagnóstico agendado | Conversa de diagnóstico marcada |
| Mapa de People enviado/realizado | Mapa enviado ou respondido |
| Proposta enviada | Proposta enviada ou em negociação (substitui "Negociação") |
| Cliente | Fechou |
| Esfriou | Parou de responder; reavaliar em ~60 dias úteis |
| Não alinhado | Fora do perfil (segmento, porte, região etc.) |
| Sem fit / perdido | Descartado ou perdido |

Nenhum encerramento exige justificativa (motivo é opcional).
Removidos: "Sinal identificado", "Enriquecendo dados", "Negociação", "Standby".

## Regras para a pesquisa diária

1. Entregar **no mínimo 20 e idealmente 30 leads novos por dia**, todos completos:
   decisor atual, cargo, LinkedIn pessoal, site, telefone, cidade, porte e sinal com fonte.
2. Nunca reabrir, rebaixar ou repetir lead com status Convite enviado em diante,
   Esfriou, Não alinhado ou Sem fit / perdido — nem outro lead da mesma empresa.
3. Antes de pesquisar, consultar `public.v_padroes_nao_alinhados` e **evitar** perfis
   (segmento, categoria, porte, cidade) com muitos descartes e poucos aproveitamentos.
4. Marcar os leads com `pesquisa-dia-AAAA-MM-DD` e `selecao-dia-AAAA-MM-DD` (data de São Paulo),
   preencher `icp_fit` (7–10) e `segmento` (A indústria/saúde, B tecnologia/marketing,
   C contabilidade/jurídico/coworking, D outros serviços). Sem `icp_fit` o lead não aparece
   em "Contatos de hoje".
5. Criar, em `visoes_salvas`, a visão do dia chamada `Leads DD/MM` com
   `filtros = {"pesquisa": "AAAA-MM-DD"}` — é ela que aparece na linha "Visões" da tela de leads.
6. Preencher `telefone` (da empresa ou do decisor, com fonte) em todos os leads entregues.
7. Leads da base em Esfriou, Não alinhado ou Sem fit / perdido podem ganhar LinkedIn/decisor
   se campos estiverem vazios (tag `revisar-requalificar`), mas **o status nunca é alterado** — quem
   decide reabrir é a Patrícia.

## Aprendizados do ICP (atualizado 29/09/2026)

A view `v_padroes_nao_alinhados` agora conta **Convite enviado em diante** como aproveitado,
tem coluna própria para **Esfriou** e agrupa o porte em faixas (1-10, 11-50, 51-200, 201-500, 500+).

- Segmento B (tecnologia/marketing) é o que mais converte: ~79 aproveitados × 12 descartes.
- Segmento A (indústria) converte menos: ~44 × 30. Priorizar indústrias com sinal claro
  (crescimento, sucessão, expansão) e decisor no topo (CEO/fundador), não diretor comercial.
- Porte 11-50 é o melhor (41 × 10); 51-200 tem descarte alto (19 × 12).
- Descartados como Não alinhado em 29/09: empresa sendo vendida/controlada por grupo (SPRO),
  indústria média tradicional com decisor comercial (Cabopec), empresa pós-sucessão com
  hardware/governo (Dataprom), agência de SEO (liveSEO), decisor que saiu (LogPlace).
  Evitar: empresas em processo de aquisição ou controladas por grupos de fora do PR.
- Esfriou em 29/09: Centro Médico Santo Antônio, Direct Marketing, First Class Imóveis.

## Proteção absoluta da operação comercial (09/11/2026)

- A pesquisa automática só pode inserir empresas novas ou preencher **campos vazios** de registros em `Novo lead` sem evidência histórica de abordagem. Não pode modificar status, `cadencia_status`, `cadencia_toque`, `primeiro_contato_em`, `respondeu_em`, `ultima_interacao`, `proximo_followup`, `proximo_passo`, anotações comerciais manuais ou outros campos preenchidos pela Patrícia.
- **O histórico prevalece sobre o status atual.** Mesmo que alguém tenha redefinido um cadastro para `Novo lead`, qualquer evento antigo de convite, mensagem, resposta, chamada, reunião, abordagem ou cadência impede sua seleção automática. Nunca promover duplicatas da mesma empresa sob outro nome.
- Nunca fazer reset em massa para `Novo lead` por ausência de LinkedIn. A ausência de LinkedIn não apaga contato que realmente aconteceu.
- Os status `Convite enviado` e `Convite pendente` coexistem: o primeiro registra o envio; o segundo permite acompanhar o convite enquanto aguarda aceite. O status `Call` indica que uma chamada está sendo combinada. Nenhum registro antigo é migrado automaticamente para esses status.
- A Selbetti (registros `Selbetti Soluções emTecnologia - Curitiba` e `Selbetti Tecnologia`) tem histórico de contato, inclusive resposta em outubro de 2026, e deve ser tratada como **já trabalhada** para fins de prospecção, independentemente do `status` visível. Não alterar seus status sem decisão manual da Patrícia.
- A rotina diária segue a revisão de 20/10/2026: mínimo de 10 decisores inéditos com LinkedIn pessoal confirmado, desejável 20; não contar já abordados, não mudar seus status.
