-- Persiste, de forma idempotente, o enriquecimento comercial do primeiro lote validado em 01/09/2026.
-- Não altera schema, não cria leads e não mexe em campos não relacionados ao enriquecimento.
-- Os 5 primeiros leads do lote já haviam sido gravados diretamente no banco; esta migration cobre os 15 pendentes.

CREATE TEMP TABLE _cali_enriquecimento_lote_20260901 (
  lead_id uuid PRIMARY KEY,
  status_anterior text
) ON COMMIT DROP;

INSERT INTO _cali_enriquecimento_lote_20260901 (lead_id, status_anterior)
SELECT id, status
FROM public.leads
WHERE id IN (
  '7de190b5-ff93-4db2-845e-82df1c46cdeb',
  '2401fcfd-72fd-4091-b93d-1b6569123da6',
  '90c3dcbe-1133-473b-afe9-3c7627141137',
  '4dfea398-134f-4a23-8977-11a42738c6e7',
  '911b7e2e-e5d4-4e1e-af87-e4078dc1fb01',
  '66f9099b-42f6-45a9-890c-7b6d0938fdde',
  '7382d304-b577-4ce3-90d2-bda66c9a5808',
  'f1ff98c5-b139-4d7a-a835-dc97527b135a',
  'e32e97a3-58e3-4206-ba92-adc986a74ac3',
  'b0bea3eb-f5e2-4e5d-8d1a-f984c75640a9',
  '3e817f60-d37f-4004-a902-807456cdea10',
  'c4bb21c6-3288-4ae0-af6b-795669c4aa33',
  'fd81f283-7b0f-41c0-a212-f1892459c670',
  'eb073a34-b397-4321-aa9c-4f5bcaa24a5e',
  '949bac8a-7c68-44e8-9435-524d5206f726'
);

-- 1 · Metalúrgica Vale do Iguaçu — lead fictício/demo da migration inicial.
UPDATE public.leads
SET
  icp_fit = 1,
  status = 'Sem fit / perdido',
  prioridade = 'Baixa',
  sinal_compra = 'Sem sinal forte',
  tamanho_time = NULL,
  angulo_abordagem = 'Não abordar: lead fictício/demo da migration inicial; website salvo é domínio de exemplo.',
  proximo_passo = 'Nenhuma abordagem; manter somente como histórico de teste.',
  perdido_motivo = 'Lead fictício/demo'
WHERE id = '7de190b5-ff93-4db2-845e-82df1c46cdeb';

-- 2 · De Paula Embalagens
UPDATE public.leads
SET
  icp_fit = 8,
  status = 'Qualificado',
  prioridade = 'Média',
  nome_decisor = 'Natan de Paula Ribas Gemin',
  cargo_decisor = 'Sócio-administrador',
  sinal_compra = 'Sem sinal forte',
  angulo_abordagem = 'Fit operacional relevante em embalagens; abordar a gestão de pessoas sem presumir dor e validar quem responde pela frente.',
  proximo_passo = 'Validar canal direto do sócio e abordar de forma consultiva.'
WHERE id = '2401fcfd-72fd-4091-b93d-1b6569123da6';

-- 3 · Loja Do E-commerce
UPDATE public.leads
SET
  icp_fit = 5,
  status = 'Enriquecendo dados',
  prioridade = 'Baixa',
  tamanho_time = '2-10 funcionários',
  sinal_compra = 'Sem sinal forte',
  angulo_abordagem = 'Porte público abaixo do corte prioritário da CALI.',
  proximo_passo = 'Não priorizar agora; revisar se o porte crescer.'
WHERE id = '90c3dcbe-1133-473b-afe9-3c7627141137';

-- 4 · Magic Jersey
UPDATE public.leads
SET
  icp_fit = 4,
  status = 'Enriquecendo dados',
  prioridade = 'Baixa',
  sinal_compra = 'Sem sinal forte',
  angulo_abordagem = 'Operação sem porte e estrutura de pessoas suficientes validados para justificar abordagem.',
  proximo_passo = 'Manter em observação; validar porte antes de contato.'
WHERE id = '4dfea398-134f-4a23-8977-11a42738c6e7';

-- 5 · Restaurante Tempero da Alice
UPDATE public.leads
SET
  icp_fit = 4,
  status = 'Enriquecendo dados',
  prioridade = 'Baixa',
  sinal_compra = 'Sem sinal forte',
  angulo_abordagem = 'Negócio local sem evidência pública de porte ou estrutura aderente ao ICP.',
  proximo_passo = 'Não priorizar; validar porte apenas se surgir sinal.'
WHERE id = '911b7e2e-e5d4-4e1e-af87-e4078dc1fb01';

-- 6 · Curitiba Sites
UPDATE public.leads
SET
  icp_fit = 4,
  status = 'Enriquecendo dados',
  prioridade = 'Baixa',
  sinal_compra = 'Sem sinal forte',
  angulo_abordagem = 'Operação digital sem porte de equipe confirmado; baixa prioridade até validação.',
  proximo_passo = 'Manter em observação e validar porte antes de contato.'
WHERE id = '66f9099b-42f6-45a9-890c-7b6d0938fdde';

-- 7 · Agência Brand View
UPDATE public.leads
SET
  icp_fit = 6,
  status = 'Enriquecendo dados',
  prioridade = 'Baixa',
  nome_decisor = 'Isabela Shibata de Pol',
  cargo_decisor = 'Sócia-administradora',
  sinal_compra = 'Sem sinal forte',
  angulo_abordagem = 'Decisora identificada, mas porte ainda não confirmado; não promover para B sem validação.',
  proximo_passo = 'Validar tamanho da equipe e só então decidir abordagem.'
WHERE id = '7382d304-b577-4ce3-90d2-bda66c9a5808';

-- 8 · Guma Doces e Embalagens
UPDATE public.leads
SET
  icp_fit = 4,
  status = 'Enriquecendo dados',
  prioridade = 'Baixa',
  sinal_compra = 'Sem sinal forte',
  angulo_abordagem = 'Negócio de pequeno porte aparente, sem evidência suficiente de estrutura aderente.',
  proximo_passo = 'Não priorizar; revisar somente com novo sinal ou porte confirmado.'
WHERE id = 'f1ff98c5-b139-4d7a-a835-dc97527b135a';

-- 9 · Adana Restaurante
UPDATE public.leads
SET
  icp_fit = 4,
  status = 'Enriquecendo dados',
  prioridade = 'Baixa',
  sinal_compra = 'Sem sinal forte',
  angulo_abordagem = 'Restaurante local sem porte de equipe confirmado para o ICP da CALI.',
  proximo_passo = 'Não priorizar; revisar se houver expansão ou contratação.'
WHERE id = 'e32e97a3-58e3-4206-ba92-adc986a74ac3';

-- 10 · Portwell Tecnologia
UPDATE public.leads
SET
  icp_fit = 6,
  status = 'Enriquecendo dados',
  prioridade = 'Baixa',
  sinal_compra = 'Sem sinal forte',
  angulo_abordagem = 'Operação industrial tecnicamente aderente, porém o porte corporativo público é grande para o foco prioritário da CALI; houve histórico de contratação em 2026, mas não tratar como sinal quente atual.',
  proximo_passo = 'Manter fora da prioridade principal; revisar apenas com sinal executivo específico.'
WHERE id = 'b0bea3eb-f5e2-4e5d-8d1a-f984c75640a9';

-- 11 · Clínica Top Saúde Hauer
UPDATE public.leads
SET
  icp_fit = 8,
  status = 'Qualificado',
  prioridade = 'Média',
  tamanho_time = '11-50 funcionários',
  sinal_compra = 'Sem sinal forte',
  angulo_abordagem = 'Clínica com estrutura física relevante e equipe pública compatível com o ICP; abordar gestão de pessoas sem presumir problema.',
  proximo_passo = 'Identificar decisor/proprietário e canal direto antes da abordagem.'
WHERE id = '3e817f60-d37f-4004-a902-807456cdea10';

-- 12 · Imobiliária Cidalta
UPDATE public.leads
SET
  icp_fit = 7,
  status = 'Qualificado',
  prioridade = 'Média',
  nome_decisor = 'Leandro Gomes Iwersen',
  cargo_decisor = 'Sócio-administrador',
  sinal_compra = 'Sem sinal forte',
  angulo_abordagem = 'Decisor identificado e operação local com potencial de gestão de equipe; fit suficiente para abordagem sem usar sinal artificial.',
  proximo_passo = 'Localizar canal direto do sócio e fazer abordagem curta de roteamento.'
WHERE id = 'c4bb21c6-3288-4ae0-af6b-795669c4aa33';

-- 13 · Chama a TI
UPDATE public.leads
SET
  icp_fit = 3,
  status = 'Enriquecendo dados',
  prioridade = 'Baixa',
  sinal_compra = 'Sem sinal forte',
  angulo_abordagem = 'Há inconsistência entre os dados da base e os dados públicos encontrados; não abordar até validar identidade, site e telefone.',
  proximo_passo = 'Validar CNPJ, website e telefone corretos antes de qualquer contato.'
WHERE id = 'fd81f283-7b0f-41c0-a212-f1892459c670';

-- 14 · Bios Software
UPDATE public.leads
SET
  icp_fit = 1,
  status = 'Sem fit / perdido',
  prioridade = 'Baixa',
  sinal_compra = 'Sem sinal forte',
  angulo_abordagem = 'Registro empresarial identificado como baixado/inativo; não abordar.',
  proximo_passo = 'Nenhuma abordagem; manter apenas histórico.',
  perdido_motivo = 'Empresa inativa / registro baixado'
WHERE id = 'eb073a34-b397-4321-aa9c-4f5bcaa24a5e';

-- 15 · Invest Saúde
UPDATE public.leads
SET
  icp_fit = 5,
  status = 'Enriquecendo dados',
  prioridade = 'Baixa',
  tamanho_time = '2-10 funcionários',
  sinal_compra = 'Sem sinal forte',
  angulo_abordagem = 'Porte público abaixo do corte prioritário, apesar de atuar em saúde.',
  proximo_passo = 'Não priorizar agora; revisar se houver expansão ou crescimento de equipe.'
WHERE id = '949bac8a-7c68-44e8-9435-524d5206f726';

-- Histórico do enriquecimento: uma única entrada por lead para este lote.
INSERT INTO public.lead_eventos (
  lead_id,
  tipo,
  descricao,
  status_anterior,
  status_novo,
  criado_em
)
SELECT
  b.lead_id,
  'enriquecimento',
  'Enriquecimento comercial persistido · lote 2026-09-01',
  b.status_anterior,
  l.status,
  now()
FROM _cali_enriquecimento_lote_20260901 b
JOIN public.leads l ON l.id = b.lead_id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.lead_eventos e
  WHERE e.lead_id = b.lead_id
    AND e.tipo = 'enriquecimento'
    AND e.descricao = 'Enriquecimento comercial persistido · lote 2026-09-01'
);
