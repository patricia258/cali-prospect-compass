# Cali Prospector

Comando para o Lovable — Cali · Painel de Prospecção

Cole este documento inteiro como primeiro prompt no Lovable. Anexe também o arquivo cali_painel_prospeccao.html — ele é o protótipo funcional que já testei e valida a lógica; use como referência de estrutura e comportamento, não como limite.

1. Contexto de negócio

A Cali é a marca pessoal de Patrícia Lima — HR as a Service (nunca dizer "RH fracionado"; o termo correto e único é HR as a Service). Ela é People Advisory Executive, fundadora e única executora da Cali: atende diretamente, sem equipe, sem intermediários.

Este app é uma ferramenta interna de uso pessoal da Patrícia para gerenciar prospecção ativa de clientes em Curitiba — hoje ela mantém isso em uma planilha de ~1.200 empresas e quer substituir por um painel de verdade.

Regras de conteúdo que valem para qualquer texto gerado dentro do app (labels, mensagens, placeholders, e-mails de exemplo):

Nunca usar "RH fracionado" ou "fracionado" — o termo é HR as a Service.

Nunca expor preço, faixa de valor ou "R$" em nenhum lugar do produto.

Nunca mencionar "Azumi RH" (marca anterior da Patrícia) em nenhum texto de exemplo.

Nunca usar a palavra "consultoria" isolada como definição do serviço.

Tom direto, frases curtas, sem hedging ("sem compromisso", "sem problema" são proibidos em qualquer copy de mensagem).

2. O que o protótipo atual já faz (baseline — não perder nenhuma dessas funções)

Importação de leads via CSV colado ou upload de arquivo .xlsx/.xls/.csv

No upload de .xlsx, extrai o hyperlink real das colunas Site e Google Maps (a planilha original guarda "Abrir site" / "Ver no Maps" como texto, com a URL de verdade escondida no hyperlink da célula — isso precisa ser lido corretamente, CSV puro perde essa informação)

Classificação automática de segmento por palavras-chave da categoria (indústria/saúde → A, tech/agência → B, parceria → C), editável manualmente

Filtros por Aderência, Segmento, Status e busca por texto

Pipeline de status: Não contatado, Mensagem enviada, Respondeu, Reunião agendada, Reunião realizada, Chamada agendada, Proposta enviada, Cliente, Em standby, Desalinhado, Declinou, Sem interesse — cada um com uma cor própria

Toggle "agrupar por status" que reordena e mostra cabeçalho por grupo com contagem

Ficha de detalhe do lead (nome da empresa editável, aderência, segmento, decisor, cidade, e-mail, WhatsApp/telefone, LinkedIn, site, Google Maps, nota/nº avaliações do Google, status, notas livres)

Biblioteca de 4 modelos de mensagem (segmentos A/B/C/D), versão longa (LinkedIn/e-mail) e curta (WhatsApp/Instagram), com botão de copiar já preenchendo [Empresa] e [Nome]

Exportação de volta para CSV

Dados salvos localmente (sem backend de verdade — é a principal limitação a resolver)

3. Objetivo deste projeto no Lovable

Reconstruir isso como um app completo, com banco de dados de verdade (Supabase), visual muito mais elaborado, e acrescentando automações que o protótipo em HTML puro não conseguia entregar. Pode reorganizar a interface como achar melhor — o objetivo é ficar mais bonito, mais rápido de usar no dia a dia, e com mais inteligência embutida, não replicar a tela atual pixel a pixel.

4. Modelo de dados (tabela leads)

Campo Tipo Observação id uuid pk empresa text editável aderencia text Alta / Média / Parceria / Baixa segmento text A / B / C / D / vazio categoria text ex: Atacadista, Policlínica, Indústria cidade text nome_decisor text email text whatsapp text telefone text linkedin_decisor text url website text url real (não o texto "Abrir site") google_maps text url real nota_google numeric n_avaliacoes integer status text ver lista de status acima notas text livre criado_em timestamp atualizado_em timestamp

Acrescentar (novo, não existia no protótipo):

proximo_followup (date) — data de retorno planejada

tags (text[]) — etiquetas livres além do status

origem (text) — de onde veio o lead (planilha original, indicação, etc.)

Nova tabela lead_eventos (histórico/timeline por lead):

Campo Tipo id uuid lead_id uuid (fk) tipo text — ex: "status_alterado", "mensagem_enviada", "nota_adicionada" descricao text status_anterior text (nullable) status_novo text (nullable) criado_em timestamp

5. Funcionalidades novas a construir

Dashboard inicial com métricas do funil: total de leads, leads por status (com as mesmas cores), taxa de avanço (contatado → respondeu → reunião → proposta → cliente), leads de Alta aderência ainda sem contato, leads "esfriando" (sem atualização há mais de X dias parados no mesmo status).

Visão Kanban por status, com drag-and-drop entre colunas — ao arrastar, grava automaticamente um evento em lead_eventos com status anterior/novo.

Linha do tempo por lead — histórico visível na ficha de detalhe, mostrando cada mudança de status e nota adicionada, com data.

Lembretes de follow-up — campo de data no lead; destaque visual (badge) quando a data já passou e o lead segue sem atualização.

Detecção de duplicados na importação (mesmo nome de empresa ou mesmo telefone/e-mail já cadastrado) — perguntar se quer mesclar ou ignorar, nunca duplicar silenciosamente.

Etiquetas livres (tags) além do status, para ela marcar coisas como "voltar depois do verão", "indicação da Kirsten", etc.

Ordenação de colunas na visão em tabela (por nota do Google, por cidade, por data de atualização).

Busca e filtro combinados salvos como "visões" (ex: "Alta aderência + não contatado" como filtro salvo de um clique).

Biblioteca de mensagens editável — os 4 modelos (A/B/C/D × longo/curto) devem poder ser editados dentro do próprio app, não hardcoded, para ela ajustar o texto com o tempo sem precisar de mim.

Responsivo para celular — ela usa o painel também pelo WhatsApp/celular no dia a dia.

Automações desejáveis (se o Lovable/Supabase permitir com facilidade):

Ao importar um lead sem segmento identificado, sinalizar visualmente como "definir segmento" em vez de deixar em branco silenciosamente.

Ao mudar o status para "Mensagem enviada", sugerir preencher automaticamente a data de follow-up (+3 dias úteis, editável).

Alerta (badge ou contador no dashboard) para leads parados há mais de 10 dias no mesmo status sem nota nova.

6. Diretrizes visuais (obrigatórias, marca já fechada — não são sugestão)

Paleta:

Bordô profundo #5A1E2D — cor principal / ancoragem

Marfim #F7F3EE — fundo (substitui branco puro)

Grafite #2B2B2B — texto (substitui preto absoluto)

Taupe #B7A99A — fundos secundários, elementos neutros

Dourado fosco #B58C52 — detalhe raro, nunca cor dominante

Tipografia: Playfair Display para títulos/headings, Inter para corpo de texto e UI.

Regras duras:

Azul nunca como cor dominante — pode aparecer só como contraste secundário pontual, se necessário para algum estado de sistema (ex: link), nunca como cor de marca.

Nenhum ícone genérico de "gestão de pessoas" (engrenagens, mãos dadas, gráfico de crescimento, folhas, sementes, nascer do sol). Se usar ícones, que sejam minimalistas e neutros (outline fino), nunca ilustrativos/fofos.

Muito espaço em branco, proporções refinadas, sem gradiente chamativo, sem sombra pesada.

Acabamento editorial premium — referência de qualidade: Pentagram, Collins, Landor, Interbrand. Isso vale tanto pro app quanto pra qualquer material exportado dele.

Cores de status (manter exatamente estas, é o sistema de cor já validado):

Não contatado #B7A99A

Mensagem enviada #B58C52

Respondeu #8AA37F

Reunião agendada #5C7A5A

Reunião realizada #3F6B52

Chamada agendada #5C7A5A

Proposta enviada #9C4A4F

Cliente #5A1E2D

Em standby #8A8577

Desalinhado #B0673E

Declinou #A5442F

Sem interesse #9C9088

7. Migração de dados

A base real de leads (~1.200 empresas de Curitiba) está em uma planilha exportada — vou importar pelo próprio fluxo de importação do app assim que ele estiver pronto. Não é necessário popular dados de exemplo além de 3-5 linhas fictícias para desenvolvimento.

8. O que NÃO fazer

Não simplificar o pipeline de status para um genérico tipo "Novo / Em andamento / Fechado" — os nomes e as cores acima são intencionais e precisam se manter exatamente assim.

Não adicionar qualquer campo de preço/valor comercial na ficha do lead.

Não usar o termo "fracionado" em nenhum lugar da interface ou dos textos de exemplo.

Não remover a distinção entre modelo longo e curto de mensagem — os canais (LinkedIn/ e-mail vs. WhatsApp/Instagram) exigem comprimentos diferentes por design.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cali-prospect-compass.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c87b2aff-7eef-4ead-91f4-5f895fb0c96e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
