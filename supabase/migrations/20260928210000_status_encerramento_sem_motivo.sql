-- Status de encerramento sem justificativa obrigatória + aprendizado com leads não alinhados.
-- Novos status no app: Standby, Esfriou, Não alinhado (Sinal identificado deixa de existir).

-- 1) Motivo da perda deixa de ser obrigatório.
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_perdido_motivo_check;

-- 2) Leads que ainda estiverem em "Sinal identificado" passam a "Qualificado"
--    (o sinal continua registrado em sinal_compra / sinal_detalhe).
UPDATE public.leads SET status = 'Qualificado', atualizado_em = now()
WHERE status = 'Sinal identificado';

-- 3) Padrões dos leads descartados como "Não alinhado" ou "Sem fit / perdido".
--    A pesquisa diária consulta esta view para evitar perfis que a Patrícia já rejeitou.
CREATE OR REPLACE VIEW public.v_padroes_nao_alinhados
WITH (security_invoker = true) AS
SELECT
  'segmento'::text AS dimensao,
  COALESCE(NULLIF(segmento, ''), '(vazio)') AS valor,
  count(*) FILTER (WHERE status IN ('Não alinhado', 'Sem fit / perdido')) AS descartados,
  count(*) FILTER (WHERE status IN ('Abordagem enviada', 'Em cadência', 'Conversa aberta',
    'Diagnóstico agendado', 'Mapa de People enviado/realizado', 'Proposta enviada',
    'Negociação', 'Cliente')) AS aproveitados
FROM public.leads WHERE excluido_em IS NULL GROUP BY 2
UNION ALL
SELECT 'categoria', COALESCE(NULLIF(categoria, ''), '(vazio)'),
  count(*) FILTER (WHERE status IN ('Não alinhado', 'Sem fit / perdido')),
  count(*) FILTER (WHERE status IN ('Abordagem enviada', 'Em cadência', 'Conversa aberta',
    'Diagnóstico agendado', 'Mapa de People enviado/realizado', 'Proposta enviada',
    'Negociação', 'Cliente'))
FROM public.leads WHERE excluido_em IS NULL GROUP BY 2
UNION ALL
SELECT 'porte', COALESCE(NULLIF(tamanho_time, ''), '(vazio)'),
  count(*) FILTER (WHERE status IN ('Não alinhado', 'Sem fit / perdido')),
  count(*) FILTER (WHERE status IN ('Abordagem enviada', 'Em cadência', 'Conversa aberta',
    'Diagnóstico agendado', 'Mapa de People enviado/realizado', 'Proposta enviada',
    'Negociação', 'Cliente'))
FROM public.leads WHERE excluido_em IS NULL GROUP BY 2
UNION ALL
SELECT 'cidade', COALESCE(NULLIF(initcap(split_part(cidade, '/', 1)), ''), '(vazio)'),
  count(*) FILTER (WHERE status IN ('Não alinhado', 'Sem fit / perdido')),
  count(*) FILTER (WHERE status IN ('Abordagem enviada', 'Em cadência', 'Conversa aberta',
    'Diagnóstico agendado', 'Mapa de People enviado/realizado', 'Proposta enviada',
    'Negociação', 'Cliente'))
FROM public.leads WHERE excluido_em IS NULL GROUP BY 2;

COMMENT ON VIEW public.v_padroes_nao_alinhados IS
  'Aprendizado da prospecção: por segmento, categoria, porte e cidade, quantos leads a Patrícia descartou (Não alinhado / Sem fit) vs. aproveitou (abordou em diante). Consultar antes da pesquisa diária.';
