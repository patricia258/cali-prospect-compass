# Rotina comercial do Cali Prospect

A operação diária não mede quantidade de empresas pesquisadas. Mede oportunidades utilizáveis entregues para abordagem.

## Filas

- Fila A: fit forte + sinal verificado. Prioridade de abordagem.
- Fila B: fit forte, mesmo sem sinal recente. Compõe o estoque comercial.
- Fila C: ainda precisa de pesquisa/qualificação ou ficou abaixo do corte de fit. É matéria-prima para reposição, não conta na meta diária.

## Contatos de hoje

O painel seleciona até 20 leads A/B ainda não abordados, com decisor, canal e contexto suficientes para um primeiro contato humano.

A ordem prioriza: Fila A, ICP fit, prioridade e qualidade do canal direto.

Se houver menos de 20 contatos, a interface informa quantos faltam e oferece a visão de reposição da Fila C para pesquisa.

## Ficha do lead

Cada lead abordável deve mostrar de forma didática:

- canal recomendado;
- pessoa com quem falar;
- por que vale abordar;
- primeiro objetivo;
- o que evitar no primeiro contato;
- mensagem inicial sugerida;
- botão para copiar a mensagem;
- botão para registrar o envio e agendar o follow-up.

O primeiro contato não deve apresentar todo o portfólio da CALI, enviar PDF/Mapa de People ou usar perguntas genéricas sobre "maior desafio". O objetivo inicial é abrir conversa e confirmar quem responde pela gestão de pessoas.

## Fonte de verdade

Os leads e o histórico ficam no Supabase. A lógica de produto fica neste repositório GitHub conectado ao Lovable. Alterações de código devem ser feitas no repositório; enriquecimentos recorrentes devem ser persistidos no banco, não em migrations de lote.