-- Restringe o acesso às tabelas do painel apenas ao e-mail da Patrícia.
-- Antes, qualquer usuário autenticado (ou seja, qualquer pessoa que criasse uma
-- conta com e-mail/senha na tela de login) tinha acesso total aos leads.
--
-- Troque 'patricia@calirh.com' abaixo se o e-mail usado para logar no painel
-- for outro — sem isso, ninguém (nem ela) consegue mais entrar.

DROP POLICY IF EXISTS "leads_authenticated_all" ON public.leads;
DROP POLICY IF EXISTS "lead_eventos_authenticated_all" ON public.lead_eventos;
DROP POLICY IF EXISTS "modelos_authenticated_all" ON public.modelos_mensagem;
DROP POLICY IF EXISTS "visoes_authenticated_all" ON public.visoes_salvas;

CREATE POLICY "leads_only_patricia" ON public.leads
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'patricia@calirh.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'patricia@calirh.com');

CREATE POLICY "lead_eventos_only_patricia" ON public.lead_eventos
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'patricia@calirh.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'patricia@calirh.com');

CREATE POLICY "modelos_only_patricia" ON public.modelos_mensagem
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'patricia@calirh.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'patricia@calirh.com');

CREATE POLICY "visoes_only_patricia" ON public.visoes_salvas
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'patricia@calirh.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'patricia@calirh.com');
