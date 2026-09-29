-- Lista de status enxuta: sai "Enriquecendo dados", "Negociação" e "Standby"; entra "Convite enviado".
UPDATE public.leads SET status = 'Novo lead', atualizado_em = now() WHERE status = 'Enriquecendo dados';
UPDATE public.leads SET status = 'Proposta enviada', atualizado_em = now() WHERE status = 'Negociação';
UPDATE public.leads SET status = 'Esfriou', atualizado_em = now() WHERE status = 'Standby';
