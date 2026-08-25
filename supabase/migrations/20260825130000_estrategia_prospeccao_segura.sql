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
  USING ((auth.jwt() ->> 'email') = 'patricia@calirh.com');

CREATE POLICY "leads_insert_patricia" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'email') = 'patricia@calirh.com');

CREATE POLICY "leads_update_patricia" ON public.leads
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'patricia@calirh.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'patricia@calirh.com');

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
  USING ((auth.jwt() ->> 'email') = 'patricia@calirh.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'patricia@calirh.com');

DROP POLICY IF EXISTS "importacoes_only_patricia" ON public.importacoes_leads;
CREATE POLICY "importacoes_only_patricia" ON public.importacoes_leads
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') = 'patricia@calirh.com');

DROP POLICY IF EXISTS "importacoes_insert_patricia" ON public.importacoes_leads;
CREATE POLICY "importacoes_insert_patricia" ON public.importacoes_leads
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'email') = 'patricia@calirh.com');

DROP TRIGGER IF EXISTS trg_estrategias_atualizado_em ON public.estrategias_mensagem;
CREATE TRIGGER trg_estrategias_atualizado_em
BEFORE UPDATE ON public.estrategias_mensagem
FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

INSERT INTO public.estrategias_mensagem (sinal, toque, titulo, quando_enviar, objetivo, corpo)
VALUES
('Sem sinal', 1, 'Convite contextual', 'Dia 1', 'Abrir a conexão sem pitch',
 'Oi, [Nome]. Tenho acompanhado empresas em fase de estruturação e crescimento. Na [Empresa], esse tema já aparece no radar das lideranças?'),
('Sem sinal', 2, 'Insight de valor', '1–2 dias após aceitar', 'Abrir conversa',
 'Uma coisa que observo em empresas em crescimento: a operação costuma ganhar velocidade antes de papéis, liderança e rituais de gestão. O custo aparece como sobrecarga e decisões concentradas. Isso conversa com o momento da [Empresa]?'),
('Sem sinal', 3, 'Ponte para a dor', '3–4 dias depois', 'Diagnosticar prioridade',
 'Hoje, o desafio de vocês está mais em organizar responsabilidades, fortalecer as lideranças ou dar previsibilidade ao crescimento do time?'),
('Sem sinal', 4, 'Convite claro', '3–4 dias depois', 'Agendar conversa',
 'Se fizer sentido, podemos olhar isso por 20 minutos. Tenho [Horário 1] ou [Horário 2]. Qual funciona melhor?'),

('Engajou em conteúdo', 1, 'Convite pelo conteúdo', 'Dia 1', 'Reconhecer o sinal real',
 'Oi, [Nome]. Vi sua interação no conteúdo sobre [Sinal específico]. Gostei especialmente do ponto sobre [Detalhe verificável]. Vamos nos conectar?'),
('Engajou em conteúdo', 2, 'Insight relacionado', '1–2 dias após aceitar', 'Entregar valor',
 'Aquele tema costuma aparecer quando a empresa cresce mais rápido do que a clareza de papéis e liderança. Uma boa pergunta é: o que hoje ainda depende de poucas pessoas para funcionar?'),
('Engajou em conteúdo', 3, 'Ponte pelo contexto', '3–4 dias depois', 'Diagnosticar prioridade',
 'Na [Empresa], esse assunto está mais ligado a crescimento, sobrecarga das lideranças ou organização do RH?'),
('Engajou em conteúdo', 4, 'Convite de 20 minutos', '3–4 dias depois', 'Agendar conversa',
 'A conversa ficou boa. Faz sentido aprofundarmos por 20 minutos? Tenho [Horário 1] ou [Horário 2].'),

('Visitou perfil', 1, 'Convite sem pressupor intenção', 'Dia 1', 'Criar conexão com naturalidade',
 'Oi, [Nome]. Vi que nossos caminhos se cruzaram por aqui. Tenho trabalhado com empresas que precisam organizar pessoas e liderança sem criar uma estrutura pesada. Vamos nos conectar?'),
('Visitou perfil', 2, 'Valor antes da oferta', '1–2 dias após aceitar', 'Abrir conversa',
 'O sinal que mais vejo antes de uma empresa buscar apoio é simples: decisões de pessoas começam a consumir tempo demais da liderança. Como esse tema aparece hoje na [Empresa]?'),
('Visitou perfil', 3, 'Pergunta diagnóstica', '3–4 dias depois', 'Entender a dor',
 'Se você tivesse que escolher um ponto para dar mais clareza agora, seria liderança, papéis, cultura ou rotina de gestão?'),
('Visitou perfil', 4, 'Convite objetivo', '3–4 dias depois', 'Agendar conversa',
 'Posso te mostrar como fazemos essa leitura no Mapa de People. São 20 minutos. Tenho [Horário 1] ou [Horário 2].'),

('Empresa contratando', 1, 'Convite pela contratação', 'Dia 1', 'Conectar pelo momento da empresa',
 'Oi, [Nome]. Vi que a [Empresa] está ampliando o time. Crescer sem perder clareza, cultura e qualidade de entrega vira uma pauta importante nessa fase. Vamos nos conectar?'),
('Empresa contratando', 2, 'Insight de contratação', '1–2 dias após aceitar', 'Entregar valor',
 'Contratação resolve capacidade, mas também aumenta a exigência sobre papéis, liderança e integração. Quando isso não acompanha, o time cresce e a dependência das pessoas-chave também.'),
('Empresa contratando', 3, 'Ponte para a dor', '3–4 dias depois', 'Diagnosticar prioridade',
 'Como vocês estão cuidando para que a expansão do time não aumente sobrecarga ou perda de alinhamento?'),
('Empresa contratando', 4, 'Convite claro', '3–4 dias depois', 'Agendar conversa',
 'Faz sentido olharmos esse momento por 20 minutos? Tenho [Horário 1] ou [Horário 2].'),

('Crescimento / expansão', 1, 'Convite pela expansão', 'Dia 1', 'Conectar pelo sinal real',
 'Oi, [Nome]. Vi o movimento de crescimento da [Empresa]. Nessa fase, a operação costuma acelerar antes da organização das pessoas. Vamos nos conectar?'),
('Crescimento / expansão', 2, 'Insight de escala', '1–2 dias após aceitar', 'Entregar valor',
 'Uma pergunta útil em expansão é: quais decisões ainda dependem do fundador ou de poucas lideranças? Esse mapa costuma revelar onde a escala pode travar.'),
('Crescimento / expansão', 3, 'Ponte para a estrutura', '3–4 dias depois', 'Diagnosticar prioridade',
 'Como vocês estão olhando para liderança, papéis e estrutura para acompanhar esse crescimento?'),
('Crescimento / expansão', 4, 'Convite claro', '3–4 dias depois', 'Agendar conversa',
 'Se for uma pauta atual, podemos fazer uma leitura inicial em 20 minutos. Tenho [Horário 1] ou [Horário 2].'),

('Novo cargo', 1, 'Convite pelo novo momento', 'Dia 1', 'Reconhecer a mudança',
 'Oi, [Nome]. Vi seu novo momento na [Empresa]. Início de cadeira costuma trazer uma leitura rápida do que precisa ser preservado e do que precisa mudar. Vamos nos conectar?'),
('Novo cargo', 2, 'Insight de primeiros 90 dias', '1–2 dias após aceitar', 'Entregar valor',
 'Nos primeiros 90 dias, separar sintoma de causa evita atacar processo quando o problema é clareza de papel, liderança ou decisão. É uma leitura que reduz bastante ruído.'),
('Novo cargo', 3, 'Ponte para prioridade', '3–4 dias depois', 'Diagnosticar prioridade',
 'Qual tema de pessoas mais pede sua atenção agora: estrutura, liderança, cultura ou performance?'),
('Novo cargo', 4, 'Convite claro', '3–4 dias depois', 'Agendar conversa',
 'Se ajudar, podemos organizar essa leitura em 20 minutos. Tenho [Horário 1] ou [Horário 2].'),

('Postou sobre a dor', 1, 'Convite pelo ponto publicado', 'Dia 1', 'Reconhecer o contexto real',
 'Oi, [Nome]. Li seu ponto sobre [Sinal específico]. A parte sobre [Detalhe verificável] me chamou atenção porque aparece muito em empresas em crescimento. Vamos nos conectar?'),
('Postou sobre a dor', 2, 'Insight complementar', '1–2 dias após aceitar', 'Agregar valor',
 'Uma camada que complementa seu ponto: quando a dor se repete, normalmente existe uma decisão, papel ou rotina de liderança ainda pouco clara por trás dela.'),
('Postou sobre a dor', 3, 'Pergunta aberta', '3–4 dias depois', 'Diagnosticar prioridade',
 'Na [Empresa], esse tema já virou prioridade prática ou ainda está sendo observado?'),
('Postou sobre a dor', 4, 'Convite claro', '3–4 dias depois', 'Agendar conversa',
 'Faz sentido trocarmos 20 minutos sobre isso? Tenho [Horário 1] ou [Horário 2].'),

('Indicação', 1, 'Convite por indicação', 'Dia 1', 'Usar a confiança existente',
 'Oi, [Nome]. [Pessoa que indicou] sugeriu que eu falasse com você sobre o momento da [Empresa]. Atuo na conexão entre estratégia, liderança e gestão de pessoas. Vamos nos conectar?'),
('Indicação', 2, 'Contexto útil', '1–2 dias após aceitar', 'Abrir conversa',
 'Para eu não partir de uma suposição: qual tema de pessoas ou liderança mais ocupa espaço hoje na [Empresa]?'),
('Indicação', 3, 'Ponte para diagnóstico', '3–4 dias depois', 'Entender prioridade',
 'Pelo que você trouxe, vale separar o que é urgência do que é estrutural. É exatamente essa leitura que fazemos no Mapa de People.'),
('Indicação', 4, 'Convite claro', '3–4 dias depois', 'Agendar conversa',
 'Podemos olhar isso juntos por 20 minutos. Tenho [Horário 1] ou [Horário 2].');
