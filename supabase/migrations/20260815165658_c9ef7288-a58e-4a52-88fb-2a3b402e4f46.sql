CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa text NOT NULL,
  aderencia text,
  segmento text,
  categoria text,
  cidade text,
  nome_decisor text,
  email text,
  whatsapp text,
  telefone text,
  linkedin_decisor text,
  website text,
  google_maps text,
  nota_google numeric,
  n_avaliacoes integer,
  status text NOT NULL DEFAULT 'Não contatado',
  notas text,
  proximo_followup date,
  tags text[] NOT NULL DEFAULT '{}',
  origem text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  descricao text,
  status_anterior text,
  status_novo text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.modelos_mensagem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segmento text NOT NULL,
  canal text NOT NULL,
  titulo text NOT NULL,
  corpo text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (segmento, canal)
);

CREATE TABLE public.visoes_salvas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  filtros jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_atualizado_em ON public.leads(atualizado_em);
CREATE INDEX idx_lead_eventos_lead ON public.lead_eventos(lead_id, criado_em DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_eventos TO authenticated;
GRANT ALL ON public.lead_eventos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modelos_mensagem TO authenticated;
GRANT ALL ON public.modelos_mensagem TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visoes_salvas TO authenticated;
GRANT ALL ON public.visoes_salvas TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_mensagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visoes_salvas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_authenticated_all" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "lead_eventos_authenticated_all" ON public.lead_eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "modelos_authenticated_all" ON public.modelos_mensagem FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "visoes_authenticated_all" ON public.visoes_salvas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_atualizado_em()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_leads_atualizado_em BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();
CREATE TRIGGER trg_modelos_atualizado_em BEFORE UPDATE ON public.modelos_mensagem
FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

INSERT INTO public.leads (empresa, aderencia, segmento, categoria, cidade, nome_decisor, email, whatsapp, telefone, website, google_maps, nota_google, n_avaliacoes, status, notas, origem, tags, proximo_followup) VALUES
('Metalúrgica Vale do Iguaçu', 'Alta', 'A', 'Indústria', 'Curitiba', 'Ricardo Alves', 'ricardo@vidoiguacu.com.br', '41999990001', '4132220001', 'https://exemplo.com/vale-iguacu', 'https://maps.google.com/?q=metalurgica', 4.6, 128, 'Não contatado', '', 'planilha original', '{}', NULL),
('Policlínica Batel', 'Alta', 'A', 'Policlínica', 'Curitiba', 'Marina Duarte', 'marina@policlinicabatel.com.br', '41999990002', NULL, 'https://exemplo.com/policlinica-batel', 'https://maps.google.com/?q=policlinica', 4.8, 342, 'Mensagem enviada', 'Enviado por LinkedIn.', 'planilha original', '{"voltar depois do verão"}', CURRENT_DATE - 2),
('Órbita Software', 'Média', 'B', 'Tecnologia', 'Curitiba', 'Felipe Nunes', 'felipe@orbita.dev', '41999990003', NULL, 'https://exemplo.com/orbita', NULL, 4.4, 57, 'Respondeu', 'Pediu para retomar em duas semanas.', 'indicação', '{}', CURRENT_DATE + 5),
('Contábil Prisma', 'Parceria', 'C', 'Contabilidade', 'Curitiba', 'Ana Kirsten', 'ana@prismacontabil.com.br', '41999990004', '4132220004', NULL, NULL, 4.2, 21, 'Reunião agendada', '', 'indicação', '{"indicação da Kirsten"}', CURRENT_DATE + 1),
('Atacadista Serra Verde', 'Alta', 'A', 'Atacadista', 'São José dos Pinhais', NULL, NULL, '41999990005', NULL, NULL, NULL, 4.1, 88, 'Não contatado', '', 'planilha original', '{}', NULL);

INSERT INTO public.modelos_mensagem (segmento, canal, titulo, corpo) VALUES
('A', 'longo', 'Segmento A · LinkedIn / e-mail', E'Olá, [Nome].\nSou Patrícia Lima, fundadora da Cali — HR as a Service.\n[fato específico sobre a operação de [Empresa]] normalmente chegam a um ponto em que a gestão de pessoas precisa de tanto critério quanto a operação — e isso raramente acontece sozinho.\nAtuo com HR as a Service ao lado do dono: sem contratar estrutura fixa, sem terceirizar a decisão.\nSeparei o Mapa de People para a [Empresa] — uma leitura executiva gratuita sobre onde a gestão de pessoas pode ganhar mais clareza e previsibilidade agora.\nFaz sentido eu enviar?\n\nPatrícia Lima · People Advisory Executive · Cali'),
('A', 'curto', 'Segmento A · WhatsApp / Instagram', 'Oi, [Nome]. Sou a Patrícia, da Cali — HR as a Service para empresas como a [Empresa]. Separei o Mapa de People: leitura executiva gratuita sobre gestão de pessoas e liderança. Posso te enviar?'),
('B', 'longo', 'Segmento B · LinkedIn / e-mail', E'Olá, [Nome].\nSou Patrícia Lima, fundadora da Cali — HR as a Service para empresas de tecnologia e serviços em crescimento.\nEmpresas no ritmo da [Empresa] costumam escalar entrega antes de escalar liderança — e é exatamente aí que a gestão de pessoas precisa virar prioridade, não reação.\nAtuo com HR as a Service ao lado da liderança, sem virar mais uma camada de operação.\nSeparei o Mapa de People para vocês — leitura executiva gratuita do momento atual de gente e liderança na [Empresa]. Envio?\n\nPatrícia Lima · People Advisory Executive · Cali'),
('B', 'curto', 'Segmento B · WhatsApp / Instagram', 'Oi, [Nome]! Aqui é a Patrícia, da Cali — HR as a Service pra tech/serviço em crescimento. Separei o Mapa de People pra [Empresa]: leitura executiva gratuita sobre liderança e time. Quer receber?'),
('C', 'longo', 'Segmento C · LinkedIn / e-mail', E'Olá, [Nome].\nSou Patrícia Lima, fundadora da Cali — HR as a Service para PMEs em crescimento.\nImagino que boa parte das empresas que passam pela [Empresa] estejam no momento em que gestão de pessoas começa a pedir mais estrutura.\nNão é uma abordagem comercial — é um convite para pensarmos indicação recíproca: eu vejo empresas que precisam de [contabilidade/espaço/serviço], vocês veem empresas com gente e liderança pedindo apoio.\nFaz sentido um café ou uma call de 20 minutos?\n\nPatrícia Lima · People Advisory Executive · Cali'),
('C', 'curto', 'Segmento C · WhatsApp / Instagram', 'Oi, [Nome]! Aqui é a Patrícia, da Cali — HR as a Service. Queria propor troca de indicações entre a Cali e a [Empresa]. Topa um café rápido essa semana?'),
('D', 'longo', 'Segmento D · LinkedIn / e-mail', E'Olá, [Nome].\nSou Patrícia Lima, fundadora da Cali — HR as a Service.\n[fato específico e verificável sobre a operação: unidades, m², segmentos] exige lideranças alinhadas e rotinas de gestão claras, sustentadas com consistência mesmo quando as demandas se sobrepõem.\nA Cali apoia empresas a conectar pessoas, liderança e performance à operação do negócio — com HR as a Service, sem adicionar estrutura fixa.\nDeixo o Mapa de People: uma leitura executiva gratuita, com devolutiva direta sobre pontos de atenção e oportunidades na gestão da [Empresa].\nFaz sentido eu encaminhar?\n\nPatrícia Lima · People Advisory Executive · Cali · calirh.com'),
('D', 'curto', 'Segmento D · WhatsApp / Instagram', 'Olá, [Nome]. Sou Patrícia Lima, da Cali — HR as a Service. [fato específico curto] pede lideranças alinhadas e rotina de gestão clara. Tenho um Mapa de People — leitura executiva gratuita sobre onde a [Empresa] pode ganhar mais previsibilidade em gente. Posso enviar?');

INSERT INTO public.visoes_salvas (nome, filtros) VALUES
('Alta aderência · não contatado', '{"aderencia":"Alta","status":"Não contatado"}'),
('Follow-up vencido', '{"followupVencido":true}'),
('Sem segmento definido', '{"segmento":"__vazio__"}');