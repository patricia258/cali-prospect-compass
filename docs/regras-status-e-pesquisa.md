# Status dos leads e regras para a pesquisa diária

Vale para qualquer pessoa ou IA (Claude, ChatGPT/Codex) que alimente o Prospect Compass.

## Status

| Status | Quando usar | Justificativa |
|---|---|---|
| Novo lead | Entrou na base, ainda sem pesquisa completa | — |
| Enriquecendo dados | Pesquisa em andamento | — |
| Qualificado | Decisor, canal, site, porte e contexto verificados | — |
| Abordagem enviada | Primeiro contato feito | — |
| Em cadência | Follow-ups em andamento | — |
| Conversa aberta | O lead respondeu | — |
| Diagnóstico agendado | Conversa de diagnóstico marcada | — |
| Mapa de People enviado/realizado | Mapa enviado ou respondido | — |
| Proposta enviada / Negociação / Cliente | Etapas comerciais finais | — |
| Standby | Pausa combinada; retomar depois (follow-up automático em ~20 dias úteis) | Não exige |
| Esfriou | Parou de responder; reavaliar em ~60 dias úteis | Não exige |
| Não alinhado | Fora do perfil (segmento, porte, região etc.) | Não exige |
| Sem fit / perdido | Descartado ou perdido | Não exige (motivo é opcional) |

"Sinal identificado" foi removido: o sinal fica registrado nos campos `sinal_compra` / `sinal_detalhe`.

## Regras para a pesquisa diária

1. Entregar **no mínimo 20 e idealmente 30 leads novos por dia**, todos completos:
   decisor atual, cargo, LinkedIn pessoal, site, telefone, cidade, porte e sinal com fonte.
2. Nunca reabrir, rebaixar ou repetir lead com status Abordagem enviada em diante,
   Standby, Esfriou, Não alinhado ou Sem fit / perdido — nem outro lead da mesma empresa.
3. Antes de pesquisar, consultar `public.v_padroes_nao_alinhados` e **evitar** perfis
   (segmento, categoria, porte, cidade) com muitos descartes e poucos aproveitamentos.
4. Marcar os leads com `pesquisa-dia-AAAA-MM-DD` e `selecao-dia-AAAA-MM-DD` (data de São Paulo),
   preencher `icp_fit` (7–10) e `segmento` (A indústria/saúde, B tecnologia/marketing,
   C contabilidade/jurídico/coworking, D outros serviços). Sem `icp_fit` o lead não aparece
   em "Contatos de hoje".
