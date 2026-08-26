-- Evolui o Cali Prospect para prospecção orientada por sinais e protege importações.
-- Esta migration preserva os registros existentes e converte o funil anterior.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS cargo_decisor text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS linkedin_empresa text,
  ADD COLUMN IF NOT EXISTS tamanho_time text,
  ADD COLUMN IF NOT EXISTS faixa_faturamento text,
  ADD COLUMN IF NOT EXISTS papel_contato text,
  ADD COLUMN IF NOT EXISTS icp_fit smallint,
  ADD COLUMN IF NOT EXISTS dor_provavel text,
  ADD COLUMN IF NOT EXISTS pessoas_chave text,
  ADD COLUMN IF NOT EXISTS estagio_crescimento text,
  ADD COLUMN IF NOT EXISTS sinal_compra text,
  ADD COLUMN IF NOT EXISTS sinal_detalhe text,
  ADD COLUMN IF NOT EXISTS sinal_fonte_url text,
  ADD COLUMN IF NOT EXISTS sinal_data date,
  ADD COLUMN IF NOT EXISTS prioridade text NOT NULL DEFAULT 'Média',
  ADD COLUMN IF NOT EXISTS responsavel text NOT NULL DEFAULT 'Patrícia',
  ADD COLUMN IF NOT EXISTS proximo_passo text,
  ADD COLUMN IF NOT EXISTS angulo_abordagem text,
  ADD COLUMN IF NOT EXISTS modelo_usado text,
  ADD COLUMN IF NOT EXISTS cadencia_atual text DEFAULT 'LinkedIn · 4 toques',
  ADD COLUMN IF NOT EXISTS cadencia_status text NOT NULL DEFAULT 'Não iniciada',
  ADD COLUMN IF NOT EXISTS cadencia_toque smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS objecao text,
  ADD COLUMN IF NOT EXISTS resposta_objecao text,
  ADD COLUMN IF NOT EXISTS ultima_interacao timestamptz,
  ADD COLUMN IF NOT EXISTS primeiro_contato_em timestamptz,
  ADD COLUMN IF NOT EXISTS respondeu_em timestamptz,
  ADD COLUMN IF NOT EXISTS diagnostico_agendado_em timestamptz,
  ADD COLUMN IF NOT EXISTS mapa_people_em timestamptz,
  ADD COLUMN IF NOT EXISTS proposta_enviada_em timestamptz,
  ADD COLUMN IF NOT EXISTS perdido_motivo text,
  ADD COLUMN IF NOT EXISTS excluido_em timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_icp_fit_check'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_icp_fit_check CHECK (icp_fit IS NULL OR icp_fit BETWEEN 1 AND 10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_cadencia_toque_check'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_cadencia_toque_check CHECK (cadencia_toque BETWEEN 0 AND 4);
  END IF;
END $$;

-- Guarda o motivo antes de consolidar os estágios encerrados.
UPDATE public.leads
SET perdido_motivo = COALESCE(perdido_motivo, status)
WHERE status IN ('Desalinhado', 'Declinou', 'Sem interesse');

UPDATE public.leads
SET status = CASE status
  WHEN 'Não contatado' THEN 'Novo lead'
  WHEN 'Mensagem enviada' THEN 'Abordagem enviada'
  WHEN 'Respondeu' THEN 'Conversa aberta'
  WHEN 'Reunião agendada' THEN 'Diagnóstico agendado'
  WHEN 'Chamada agendada' THEN 'Diagnóstico agendado'
  WHEN 'Reunião realizada' THEN 'Mapa de People enviado/realizado'
  WHEN 'Em standby' THEN 'Em cadência'
  WHEN 'Desalinhado' THEN 'Sem fit / perdido'
  WHEN 'Declinou' THEN 'Sem fit / perdido'
  WHEN 'Sem interesse' THEN 'Sem fit / perdido'
  ELSE status
END;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_perdido_motivo_check'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_perdido_motivo_check
      CHECK (
        status <> 'Sem fit / perdido'
        OR NULLIF(BTRIM(perdido_motivo), '') IS NOT NULL
      );
  END IF;
END $$;

UPDATE public.leads
SET sinal_compra = COALESCE(sinal_compra, 'Sem sinal')
WHERE sinal_compra IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_followup ON public.leads(proximo_followup)
  WHERE excluido_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_sinal ON public.leads(sinal_compra)
  WHERE excluido_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_prioridade ON public.leads(prioridade)
  WHERE excluido_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_excluido_em ON public.leads(excluido_em);

-- O painel não recebe permissão de DELETE. Exclusão funcional é sempre soft delete.
REVOKE DELETE ON public.leads FROM authenticated;
DROP POLICY IF EXISTS "leads_only_patricia" ON public.leads;
DROP POLICY IF EXISTS "leads_select_patricia" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_patricia" ON public.leads;
DROP POLICY IF EXISTS "leads_update_patricia" ON public.leads;

CREATE POLICY "leads_select_patricia" ON public.leads
  FOR SELECT TO authenticated
  USING (((SELECT auth.jwt()) ->> 'email') = 'patricia@calirh.com');

CREATE POLICY "leads_insert_patricia" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (((SELECT auth.jwt()) ->> 'email') = 'patricia@calirh.com');

CREATE POLICY "leads_update_patricia" ON public.leads
  FOR UPDATE TO authenticated
  USING (((SELECT auth.jwt()) ->> 'email') = 'patricia@calirh.com')
  WITH CHECK (((SELECT auth.jwt()) ->> 'email') = 'patricia@calirh.com');

CREATE TABLE IF NOT EXISTS public.estrategias_mensagem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sinal text NOT NULL,
  toque smallint NOT NULL CHECK (toque BETWEEN 1 AND 4),
  titulo text NOT NULL,
  quando_enviar text NOT NULL,
  objetivo text NOT NULL,
  corpo text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sinal, toque)
);

CREATE TABLE IF NOT EXISTS public.importacoes_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arquivo text,
  modo text NOT NULL,
  total_anterior integer NOT NULL DEFAULT 0,
  novos integer NOT NULL DEFAULT 0,
  atualizados integer NOT NULL DEFAULT 0,
  ignorados integer NOT NULL DEFAULT 0,
  snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estrategias_mensagem TO authenticated;
GRANT ALL ON public.estrategias_mensagem TO service_role;
GRANT SELECT, INSERT ON public.importacoes_leads TO authenticated;
GRANT ALL ON public.importacoes_leads TO service_role;

ALTER TABLE public.estrategias_mensagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.importacoes_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "estrategias_only_patricia" ON public.estrategias_mensagem;
CREATE POLICY "estrategias_only_patricia" ON public.estrategias_mensagem
  FOR ALL TO authenticated
  USING (((SELECT auth.jwt()) ->> 'email') = 'patricia@calirh.com')
  WITH CHECK (((SELECT auth.jwt()) ->> 'email') = 'patricia@calirh.com');

DROP POLICY IF EXISTS "importacoes_only_patricia" ON public.importacoes_leads;
CREATE POLICY "importacoes_only_patricia" ON public.importacoes_leads
  FOR SELECT TO authenticated
  USING (((SELECT auth.jwt()) ->> 'email') = 'patricia@calirh.com');

DROP POLICY IF EXISTS "importacoes_insert_patricia" ON public.importacoes_leads;
CREATE POLICY "importacoes_insert_patricia" ON public.importacoes_leads
  FOR INSERT TO authenticated
  WITH CHECK (((SELECT auth.jwt()) ->> 'email') = 'patricia@calirh.com');

DROP TRIGGER IF EXISTS trg_estrategias_atualizado_em ON public.estrategias_mensagem;
CREATE TRIGGER trg_estrategias_atualizado_em
BEFORE UPDATE ON public.estrategias_mensagem
FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- Sem sinal não recebe cadência comercial. Nesse caso, o app mostra apenas o roteiro de
-- identificação do decisor e mantém o lead na fila de enriquecimento.
DELETE FROM public.estrategias_mensagem WHERE sinal = 'Sem sinal';

INSERT INTO public.estrategias_mensagem (sinal, toque, titulo, quando_enviar, objetivo, corpo)
VALUES
('Engajou em conteúdo', 1, 'Abrir pelo conteúdo', 'Dia 1', 'Reconhecer o sinal sem vender',
 'Oi, [Nome]. Vi sua interação com [Sinal]. É um tema que também observo pelo lado da liderança e da organização do time. Vamos nos conectar?'),
('Engajou em conteúdo', 2, 'Acrescentar uma lente', '1–2 dias após a conexão', 'Entregar um insight curto',
 'Quando esse tema começa a aparecer, o problema raramente é só processo. Quase sempre há uma decisão, um papel ou uma liderança pedindo mais clareza.'),
('Engajou em conteúdo', 3, 'Checar se existe prioridade', '3–4 dias depois', 'Entender o contexto real',
 'Na [Empresa], esse assunto já aparece na prática ou foi mais uma reflexão que chamou sua atenção?'),
('Engajou em conteúdo', 4, 'Convidar com baixo atrito', '3–4 dias depois', 'Agendar 20 minutos',
 'Se estiver no radar, topa uma conversa de 20 minutos? Tenho [Horário 1] ou [Horário 2].'),

('Visitou perfil', 1, 'Abrir pelo encontro no perfil', 'Dia 1', 'Criar conexão com naturalidade',
 'Oi, [Nome]. Vi que você passou pelo meu perfil. Trabalho com empresas que estão organizando pessoas e liderança enquanto crescem. Vamos nos conectar?'),
('Visitou perfil', 2, 'Compartilhar um padrão', '1–2 dias após a conexão', 'Entregar um insight curto',
 'Um sinal que vejo com frequência é quando decisões sobre pessoas começam a consumir tempo demais de quem lidera. Normalmente falta clareza antes de faltar esforço.'),
('Visitou perfil', 3, 'Abrir diagnóstico', '3–4 dias depois', 'Descobrir a prioridade',
 'Na [Empresa], qual tema pede mais clareza hoje: papéis, liderança, cultura ou rotina de gestão?'),
('Visitou perfil', 4, 'Convidar para uma leitura', '3–4 dias depois', 'Agendar 20 minutos',
 'Se fizer sentido, podemos explorar isso por 20 minutos. Tenho [Horário 1] ou [Horário 2].'),

('Empresa contratando', 1, 'Abrir pela contratação', 'Dia 1', 'Conectar pelo movimento real',
 'Oi, [Nome]. Vi [Sinal] na [Empresa]. Quando o time cresce, clareza de papéis e liderança costuma virar uma pauta cedo. Vamos nos conectar?'),
('Empresa contratando', 2, 'Mostrar o efeito da escala', '1–2 dias após a conexão', 'Entregar um insight curto',
 'Contratar aumenta capacidade, mas também amplia a necessidade de alinhar papéis, decisões e integração. Quando isso atrasa, o time cresce e a dependência das pessoas-chave cresce junto.'),
('Empresa contratando', 3, 'Checar o impacto', '3–4 dias depois', 'Entender o contexto real',
 'Como vocês estão evitando que esse crescimento aumente a sobrecarga ou concentre ainda mais as decisões?'),
('Empresa contratando', 4, 'Convidar para uma leitura', '3–4 dias depois', 'Agendar 20 minutos',
 'Se essa pauta estiver viva, topa uma conversa de 20 minutos? Tenho [Horário 1] ou [Horário 2].'),

('Crescimento / expansão', 1, 'Abrir pela expansão', 'Dia 1', 'Conectar pelo movimento real',
 'Oi, [Nome]. Vi [Sinal] na [Empresa]. Em expansão, a operação costuma acelerar antes da organização das pessoas. Vamos nos conectar?'),
('Crescimento / expansão', 2, 'Mostrar um ponto de atenção', '1–2 dias após a conexão', 'Entregar um insight curto',
 'Uma pergunta útil nessa fase é: quais decisões ainda dependem do fundador ou de poucas lideranças? Essa concentração costuma mostrar onde o crescimento pode travar.'),
('Crescimento / expansão', 3, 'Checar a estrutura', '3–4 dias depois', 'Descobrir a prioridade',
 'Como vocês estão ajustando papéis e liderança para acompanhar esse movimento sem criar uma estrutura pesada?'),
('Crescimento / expansão', 4, 'Convidar para uma leitura', '3–4 dias depois', 'Agendar 20 minutos',
 'Se for uma pauta atual, podemos olhar isso por 20 minutos. Tenho [Horário 1] ou [Horário 2].'),

('Novo cargo', 1, 'Abrir pelo novo momento', 'Dia 1', 'Reconhecer a mudança',
 'Oi, [Nome]. Vi [Sinal]. Um novo papel sempre traz decisões sobre o que preservar e o que reorganizar. Vamos nos conectar?'),
('Novo cargo', 2, 'Oferecer uma lente inicial', '1–2 dias após a conexão', 'Entregar um insight curto',
 'Nos primeiros meses, separar sintoma de causa evita criar processo para resolver um problema de papel, liderança ou decisão. Essa leitura costuma reduzir bastante o ruído.'),
('Novo cargo', 3, 'Checar a prioridade', '3–4 dias depois', 'Descobrir o contexto real',
 'Qual tema de pessoas mais pede sua atenção agora: estrutura, liderança, cultura ou performance?'),
('Novo cargo', 4, 'Convidar para organizar a leitura', '3–4 dias depois', 'Agendar 20 minutos',
 'Se ajudar, podemos organizar essa leitura em 20 minutos. Tenho [Horário 1] ou [Horário 2].'),

('Postou sobre a dor', 1, 'Abrir pelo ponto publicado', 'Dia 1', 'Reconhecer o contexto real',
 'Oi, [Nome]. Li o que você publicou sobre [Sinal]. O ponto me chamou atenção porque também aparece nas empresas que acompanho. Vamos nos conectar?'),
('Postou sobre a dor', 2, 'Somar uma camada', '1–2 dias após a conexão', 'Entregar um insight curto',
 'Uma camada que costuma ficar escondida: quando a mesma dor se repete, quase sempre existe uma decisão, um papel ou uma rotina de liderança pouco clara por trás.'),
('Postou sobre a dor', 3, 'Checar se virou prioridade', '3–4 dias depois', 'Entender o contexto real',
 'Na [Empresa], esse tema já virou uma prioridade prática ou ainda está sendo observado?'),
('Postou sobre a dor', 4, 'Convidar para aprofundar', '3–4 dias depois', 'Agendar 20 minutos',
 'Se fizer sentido aprofundar, topa uma conversa de 20 minutos? Tenho [Horário 1] ou [Horário 2].'),

('Indicação', 1, 'Abrir pela indicação', 'Dia 1', 'Usar a confiança existente',
 'Oi, [Nome]. [Sinal]. Por isso quis conhecer melhor o momento da [Empresa]. Vamos nos conectar?'),
('Indicação', 2, 'Evitar suposições', '1–2 dias após a conexão', 'Abrir conversa com contexto',
 'Para eu não partir de uma suposição: qual tema de pessoas ou liderança mais ocupa espaço hoje na [Empresa]?'),
('Indicação', 3, 'Separar urgência de estrutura', '3–4 dias depois', 'Ajudar a organizar a prioridade',
 'Quando esse tema aparece, o que pesa mais hoje: uma urgência específica ou algo estrutural que vem se repetindo?'),
('Indicação', 4, 'Convidar para uma leitura', '3–4 dias depois', 'Agendar 20 minutos',
 'Podemos organizar essa leitura em 20 minutos. Tenho [Horário 1] ou [Horário 2].')
ON CONFLICT (sinal, toque) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  quando_enviar = EXCLUDED.quando_enviar,
  objetivo = EXCLUDED.objetivo,
  corpo = EXCLUDED.corpo,
  ativo = true,
  atualizado_em = now();
