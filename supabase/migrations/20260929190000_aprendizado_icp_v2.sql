-- Aprendizado do ICP v2:
--  * "Convite enviado" passa a contar como aproveitado (a Patrícia só convida quem ela quer abordar).
--  * "Esfriou" ganha coluna própria (não é descarte de perfil, mas sinal de interesse baixo).
--  * Porte normalizado em faixas a partir do primeiro número de tamanho_time.
DROP VIEW IF EXISTS public.v_padroes_nao_alinhados;

CREATE VIEW public.v_padroes_nao_alinhados
WITH (security_invoker = true) AS
WITH base AS (
  SELECT
    status,
    COALESCE(NULLIF(segmento, ''), '(vazio)') AS segmento,
    COALESCE(NULLIF(categoria, ''), '(vazio)') AS categoria,
    COALESCE(NULLIF(initcap(split_part(cidade, '/', 1)), ''), '(vazio)') AS cidade,
    CASE
      WHEN substring(tamanho_time FROM '\d[\d.]*') IS NULL THEN '(vazio)'
      WHEN replace(substring(tamanho_time FROM '\d[\d.]*'), '.', '')::int < 11 THEN '1-10'
      WHEN replace(substring(tamanho_time FROM '\d[\d.]*'), '.', '')::int < 51 THEN '11-50'
      WHEN replace(substring(tamanho_time FROM '\d[\d.]*'), '.', '')::int < 201 THEN '51-200'
      WHEN replace(substring(tamanho_time FROM '\d[\d.]*'), '.', '')::int < 501 THEN '201-500'
      ELSE '500+'
    END AS porte,
    status IN ('Não alinhado', 'Sem fit / perdido') AS descartado,
    status = 'Esfriou' AS esfriou,
    status IN ('Convite enviado', 'Abordagem enviada', 'Em cadência', 'Conversa aberta',
      'Diagnóstico agendado', 'Mapa de People enviado/realizado', 'Proposta enviada', 'Cliente') AS aproveitado
  FROM public.leads
  WHERE excluido_em IS NULL
),
dims AS (
  SELECT 'segmento'::text AS dimensao, segmento AS valor, descartado, esfriou, aproveitado FROM base
  UNION ALL SELECT 'categoria', categoria, descartado, esfriou, aproveitado FROM base
  UNION ALL SELECT 'porte', porte, descartado, esfriou, aproveitado FROM base
  UNION ALL SELECT 'cidade', cidade, descartado, esfriou, aproveitado FROM base
)
SELECT dimensao, valor,
  count(*) FILTER (WHERE descartado) AS descartados,
  count(*) FILTER (WHERE esfriou) AS esfriou,
  count(*) FILTER (WHERE aproveitado) AS aproveitados
FROM dims
GROUP BY dimensao, valor;

COMMENT ON VIEW public.v_padroes_nao_alinhados IS
  'Aprendizado da prospecção: por segmento, categoria, porte (faixa) e cidade — descartados (Não alinhado / Sem fit), esfriou e aproveitados (Convite enviado em diante). Consultar antes da pesquisa diária.';
