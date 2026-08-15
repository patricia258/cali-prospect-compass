import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Acesso restrito — só este(s) e-mail(s) podem entrar no painel.
 * Pode ser sobrescrito em build/deploy com VITE_ALLOWED_EMAILS="a@x.com,b@y.com".
 * IMPORTANTE: isto é a trava do lado do app. A trava de verdade (que vale mesmo que
 * alguém chame a API do Supabase direto) é a policy de RLS — ver migration
 * `20260815_restringir_acesso_email.sql`. As duas precisam estar alinhadas.
 */
const ALLOWED_EMAILS = (
  import.meta.env["VITE_ALLOWED_EMAILS"] || "patricia@calirh.com"
)
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

function isAllowed(email?: string | null) {
  return !!email && ALLOWED_EMAILS.includes(email.trim().toLowerCase());
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkAndSet(s: Session | null) {
      if (s && !isAllowed(s.user?.email)) {
        // Sessão de um e-mail não autorizado — nunca deixar passar, mesmo que já esteja logado.
        await supabase.auth.signOut();
        toast.error("Este painel é de acesso restrito à Patrícia.");
        setSession(null);
        return;
      }
      setSession(s);
    }

    supabase.auth.getSession().then(({ data }) => {
      checkAndSet(data.session).finally(() => setReady(true));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      checkAndSet(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="label-eyebrow">Carregando</p>
      </div>
    );
  }

  if (!session) return <SignIn />;
  return <>{children}</>;
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [busy, setBusy] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!isAllowed(email)) {
      toast.error("Este painel é de acesso restrito à Patrícia.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signUpError) toast.error(signUpError.message);
      else toast.success("Conta criada. Você já pode entrar.");
    }
    setBusy(false);
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("Não foi possível entrar com Google.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="label-eyebrow">Cali</p>
        <h1 className="mt-2 text-3xl text-primary">Painel de Prospecção</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acesso restrito. Entre para continuar.
        </p>

        <form onSubmit={entrar} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            Entrar
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="label-eyebrow">ou</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={google}>
          Entrar com Google
        </Button>
      </div>
    </div>
  );
}
