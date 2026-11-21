# Migração do Prospect para a conta contato Cali

Destino: `tpzcytjbglwzhgxrzzzb` (o mesmo projeto usado pelo Portal).

A aplicação publicada usava `jslzdfhldkjlvdfrvfmf`; o `.env` do repositório ainda apontava para `vamxpymoynnzfjeusybj`. A configuração `vite.config.ts` fixa agora o destino para impedir que variáveis antigas injetadas pela hospedagem mantenham a conexão anterior. O cliente gerado pelo Lovable permanece sem alterações.

Copiados e conferidos por contagem e hash: 4.802 leads, 2.512 eventos, 8 modelos, 28 visões e 36 estratégias. A tabela de importações estava vazia. Os dados não foram removidos da origem.

As seis tabelas do Prospect no destino têm RLS habilitada, acesso anônimo revogado e políticas para `patricia@calirh.com`, conforme a restrição prevista no projeto. A origem continua inalterada.

## Antes de publicar

- Sincronizar novamente registros alterados na origem desde a cópia inicial e repetir a comparação.
- Conferir o login da conta `patricia@calirh.com`. O destino contém a conta copiada do Portal, incluindo senha e autenticador; os dois sistemas compartilharão essa identidade.
- Configurar a URL de retorno `https://cali-prospect-compass.lovable.app/**` no Supabase Auth do destino.
- Configurar SMTP e provedores de login no destino caso sejam usados links por e-mail ou Google. Essas configurações não acompanham a cópia das tabelas.
- Atualizar também as variáveis SUPABASE_* e VITE_SUPABASE_* da hospedagem. Caso os clientes de servidor hoje não utilizados sejam ativados, SUPABASE_SERVICE_ROLE_KEY deve ser a chave privada do destino, somente no servidor.
- Publicar uma prévia e conferir login, listagem, edição, eventos, filtros e importação antes do corte.

O backend anterior deve permanecer disponível até a validação final. A reversão do código não sincroniza alterações de dados feitas depois do corte.

## Validação para o corte

Em 17/11/2026, a proprietária confirmou SMTP e URLs de retorno salvos e confirmou login por link e visualização dos leads na prévia do Prospect. A chave Resend substituta passou na validação sem envio de e-mail pela ferramenta. A comparação imediatamente anterior ao corte confirmou igualdade das dez tabelas entre as origens e o destino. A sincronização adicional do Portal foi concluída à noite. Os ambientes antigos serão preservados.


## Reparação da rotina em 20/11/2026

A rotina do ChatGPT consultou a origem vazia em 18/11 e foi suspensa. Confirmado o destino `tpzcytjbglwzhgxrzzzb` na conexão contato Cali com 4.802 cadastros. A view `v_padroes_nao_alinhados` não havia acompanhado a cópia de tabelas; foi restaurada por migration, com `security_invoker`, sem acesso anônimo. A validação da retomada precisa incluir tanto o agendamento quanto uma gravação real de leads pesquisados, não apenas o acesso à base.
