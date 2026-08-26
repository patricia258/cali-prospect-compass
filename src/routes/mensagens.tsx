import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CADENCIA, MENSAGEM_ROTEAMENTO, SINAIS_COMPRA } from "@/lib/cali";
import { fetchEstrategias, salvarEstrategia, type EstrategiaMensagem } from "@/lib/db";

export const Route = createFileRoute("/mensagens")({
  head: () => ({
    meta: [
      { title: "Estratégia de abordagem · Cali Prospecção" },
      {
        name: "description",
        content: "Cadências humanas de quatro toques, organizadas por sinal de compra.",
      },
    ],
  }),
  component: Mensagens,
});

function Mensagens() {
  const { data: estrategias = [] } = useQuery({
    queryKey: ["estrategias"],
    queryFn: fetchEstrategias,
  });
  const [sinal, setSinal] = useState<string>("Empresa contratando");

  const modelos = useMemo(
    () => estrategias.filter((m) => m.sinal === sinal).sort((a, b) => a.toque - b.toque),
    [estrategias, sinal],
  );

  return (
    <Shell
      title="Estratégia de abordagem"
      subtitle="Cada mensagem parte de um sinal verificável e avança de conexão para valor, diagnóstico e convite. O sistema prepara; você revisa e envia manualmente."
    >
      <div className="space-y-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CADENCIA.map((etapa) => (
            <article key={etapa.toque} className="rounded-md border bg-card p-4 shadow-card">
              <p className="label-eyebrow">
                Toque {etapa.toque} · {etapa.quando}
              </p>
              <h2 className="mt-2 text-lg text-primary">{etapa.nome}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{etapa.objetivo}</p>
            </article>
          ))}
        </section>

        <section className="rounded-md border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label-eyebrow">Biblioteca editável</p>
              <h2 className="mt-1 text-2xl text-primary">Mensagens por sinal</h2>
            </div>
            <Select value={sinal} onValueChange={setSinal}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SINAIS_COMPRA.filter((item) => item !== "Sem sinal").map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {modelos.map((modelo) => (
              <EditorEstrategia key={modelo.id} modelo={modelo} />
            ))}
            {!modelos.length ? (
              <p className="text-sm text-muted-foreground">
                Nenhum modelo cadastrado para este sinal. Crie um texto a partir do fato observado;
                não use uma abordagem genérica.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-md border bg-card p-5 shadow-card">
          <p className="label-eyebrow">Empresa sem decisor identificado</p>
          <h2 className="mt-1 text-2xl text-primary">Roteamento, não prospecção</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Use somente no telefone geral para descobrir a pessoa certa. Não apresente serviço,
            diagnóstico ou proposta antes de localizar o decisor e confirmar um sinal.
          </p>
          <div className="mt-4 rounded-md border bg-secondary/40 p-4 text-sm leading-relaxed">
            {MENSAGEM_ROTEAMENTO}
          </div>
          <Button
            className="mt-4"
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(MENSAGEM_ROTEAMENTO);
              toast.success("Mensagem de roteamento copiada.");
            }}
          >
            Copiar roteiro
          </Button>
        </section>

        <section className="rounded-md border border-dourado/40 bg-dourado/10 p-5 text-sm">
          <h2 className="text-lg text-primary">Regras que não podem ser quebradas</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>Convite não leva pitch; ele vende apenas a conexão.</li>
            <li>Sem decisor ou sem sinal verificável, o lead volta para enriquecimento.</li>
            <li>O fato citado precisa ser verdadeiro e verificável.</li>
            <li>Quem responde sai da cadência e vira conversa humana.</li>
            <li>Limite operacional: 10 a 20 convites por dia, em horários variados.</li>
            <li>Envio sempre manual, depois de leitura em voz alta.</li>
          </ul>
        </section>
      </div>
    </Shell>
  );
}

function EditorEstrategia({ modelo }: { modelo: EstrategiaMensagem }) {
  const qc = useQueryClient();
  const [corpo, setCorpo] = useState(modelo.corpo);
  useEffect(() => setCorpo(modelo.corpo), [modelo.corpo]);

  const salvar = useMutation({
    mutationFn: () => salvarEstrategia(modelo.id, corpo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estrategias"] });
      toast.success("Mensagem atualizada.");
    },
    onError: () => toast.error("Não foi possível salvar a mensagem."),
  });

  return (
    <article className="rounded-md border bg-background/60 p-5">
      <p className="label-eyebrow">
        Toque {modelo.toque} · {modelo.quando_enviar}
      </p>
      <h3 className="mt-1 text-lg text-primary">{modelo.titulo}</h3>
      <p className="mt-1 text-xs text-muted-foreground">Objetivo: {modelo.objetivo}</p>
      <Textarea
        rows={6}
        value={corpo}
        onChange={(e) => setCorpo(e.target.value)}
        className="mt-4 leading-relaxed"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => salvar.mutate()} disabled={corpo === modelo.corpo}>
          Salvar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(corpo);
            toast.success("Copiado para revisão.");
          }}
        >
          Copiar
        </Button>
      </div>
    </article>
  );
}
