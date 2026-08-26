import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Painel" },
  { to: "/leads", label: "Leads" },
  { to: "/kanban", label: "Kanban" },
  { to: "/mensagens", label: "Estratégia" },
] as const;

export function Shell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AuthGate>
      <div className="min-h-screen">
        <header className="border-b bg-card/60 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4 sm:px-8">
            <Link to="/" className="flex items-baseline gap-2">
              <span className="font-display text-xl leading-none text-primary">Cali</span>
              <span className="label-eyebrow hidden sm:inline">Prospecção</span>
            </Link>
            <nav className="flex flex-1 flex-wrap items-center gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-sm px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  activeOptions={{ exact: item.to === "/" }}
                  activeProps={{ className: "bg-secondary text-primary font-medium" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => supabase.auth.signOut()}
              className="text-muted-foreground"
            >
              Sair
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl text-primary sm:text-4xl">{title}</h1>
              {subtitle ? (
                <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>
          {children}
        </main>
      </div>
    </AuthGate>
  );
}
