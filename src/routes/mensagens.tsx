import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchModelos, salvarModelo, type Modelo } from "@/lib/db";
import { SEGMENTOS } from "@/lib/cali";

export const Route = createFileRoute("/mensagens")({
  head: () => ({
    meta: [
      { title: "Modelos de mensagem · Cali Prospecção" },
      {
        name: "description",
        content:
          "Biblioteca editável de abordagens por segmento, em versão longa e versão curta.",
      },
      { property: "og:title", content: "Modelos de mensagem · Cali Prospecção" },
      {
        property: "og:description",
        content: "Biblioteca editável de abordagens por segmento, versão longa e curta.",
      },
    ],
  }),
  component: Mensagens,
});

function Mensagens() {
  const { data: modelos = [] } = useQuery({ queryKey: ["modelos"], queryFn: fetchModelos });

  return (
    <Shell
      title="Modelos de mensagem"
      subtitle="Quatro segmentos, dois comprimentos. Versão longa para LinkedIn e e-mail; versão curta para WhatsApp e Instagram. Use [Empresa] e [Nome] — o painel preenche na hora de copiar."
    >
      <div className="space-y-10">
        {SEGMENTOS.map((seg) => (
          <section key={seg}>
            <h2 className="text-2xl text-primary">Segmento {seg}</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {modelos
                .filter((m) => m.segmento === seg)
                .sort((a) => (a.canal === "longo" ? -1 : 1))
                .map((m) => (
                  <EditorModelo key={m.id} modelo={m} />
                ))}
            </div>
          </section>
        ))}
      </div>
    </Shell>
  );
}

function EditorModelo({ modelo }: { modelo: Modelo }) {
  const qc = useQueryClient();
  const [corpo, setCorpo] = useState(modelo.corpo);
  useEffect(() => setCorpo(modelo.corpo), [modelo.corpo]);

  const salvar = useMutation({
    mutationFn: () => salvarModelo(modelo.id, corpo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modelos"] });
      toast.success("Modelo atualizado.");
    },
    onError: () => toast.error("Não foi possível salvar o modelo."),
  });

  return (
    <article className="rounded-md border bg-card p-5 shadow-card">
      <p className="label-eyebrow">{modelo.titulo}</p>
      <Textarea
        rows={modelo.canal === "longo" ? 12 : 5}
        value={corpo}
        onChange={(e) => setCorpo(e.target.value)}
        className="mt-3 leading-relaxed"
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
            toast.success("Copiado.");
          }}
        >
          Copiar
        </Button>
      </div>
    </article>
  );
}
