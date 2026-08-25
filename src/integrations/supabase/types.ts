export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      lead_eventos: {
        Row: {
          criado_em: string;
          descricao: string | null;
          id: string;
          lead_id: string;
          status_anterior: string | null;
          status_novo: string | null;
          tipo: string;
        };
        Insert: {
          criado_em?: string;
          descricao?: string | null;
          id?: string;
          lead_id: string;
          status_anterior?: string | null;
          status_novo?: string | null;
          tipo: string;
        };
        Update: {
          criado_em?: string;
          descricao?: string | null;
          id?: string;
          lead_id?: string;
          status_anterior?: string | null;
          status_novo?: string | null;
          tipo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_eventos_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          aderencia: string | null;
          angulo_abordagem: string | null;
          atualizado_em: string;
          cadencia_atual: string | null;
          cadencia_status: string;
          cadencia_toque: number;
          categoria: string | null;
          cargo_decisor: string | null;
          cidade: string | null;
          criado_em: string;
          diagnostico_agendado_em: string | null;
          dor_provavel: string | null;
          email: string | null;
          empresa: string;
          estagio_crescimento: string | null;
          estado: string | null;
          excluido_em: string | null;
          faixa_faturamento: string | null;
          google_maps: string | null;
          id: string;
          icp_fit: number | null;
          linkedin_decisor: string | null;
          linkedin_empresa: string | null;
          mapa_people_em: string | null;
          modelo_usado: string | null;
          n_avaliacoes: number | null;
          nome_decisor: string | null;
          nota_google: number | null;
          notas: string | null;
          objecao: string | null;
          origem: string | null;
          papel_contato: string | null;
          pessoas_chave: string | null;
          perdido_motivo: string | null;
          primeiro_contato_em: string | null;
          prioridade: string;
          proposta_enviada_em: string | null;
          proximo_followup: string | null;
          proximo_passo: string | null;
          respondeu_em: string | null;
          responsavel: string;
          resposta_objecao: string | null;
          segmento: string | null;
          sinal_compra: string | null;
          sinal_data: string | null;
          sinal_detalhe: string | null;
          status: string;
          tags: string[];
          tamanho_time: string | null;
          telefone: string | null;
          ultima_interacao: string | null;
          website: string | null;
          whatsapp: string | null;
        };
        Insert: {
          aderencia?: string | null;
          angulo_abordagem?: string | null;
          atualizado_em?: string;
          cadencia_atual?: string | null;
          cadencia_status?: string;
          cadencia_toque?: number;
          categoria?: string | null;
          cargo_decisor?: string | null;
          cidade?: string | null;
          criado_em?: string;
          diagnostico_agendado_em?: string | null;
          dor_provavel?: string | null;
          email?: string | null;
          empresa: string;
          estagio_crescimento?: string | null;
          estado?: string | null;
          excluido_em?: string | null;
          faixa_faturamento?: string | null;
          google_maps?: string | null;
          id?: string;
          icp_fit?: number | null;
          linkedin_decisor?: string | null;
          linkedin_empresa?: string | null;
          mapa_people_em?: string | null;
          modelo_usado?: string | null;
          n_avaliacoes?: number | null;
          nome_decisor?: string | null;
          nota_google?: number | null;
          notas?: string | null;
          objecao?: string | null;
          origem?: string | null;
          papel_contato?: string | null;
          pessoas_chave?: string | null;
          perdido_motivo?: string | null;
          primeiro_contato_em?: string | null;
          prioridade?: string;
          proposta_enviada_em?: string | null;
          proximo_followup?: string | null;
          proximo_passo?: string | null;
          respondeu_em?: string | null;
          responsavel?: string;
          resposta_objecao?: string | null;
          segmento?: string | null;
          sinal_compra?: string | null;
          sinal_data?: string | null;
          sinal_detalhe?: string | null;
          status?: string;
          tags?: string[];
          tamanho_time?: string | null;
          telefone?: string | null;
          ultima_interacao?: string | null;
          website?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          aderencia?: string | null;
          angulo_abordagem?: string | null;
          atualizado_em?: string;
          cadencia_atual?: string | null;
          cadencia_status?: string;
          cadencia_toque?: number;
          categoria?: string | null;
          cargo_decisor?: string | null;
          cidade?: string | null;
          criado_em?: string;
          diagnostico_agendado_em?: string | null;
          dor_provavel?: string | null;
          email?: string | null;
          empresa?: string;
          estagio_crescimento?: string | null;
          estado?: string | null;
          excluido_em?: string | null;
          faixa_faturamento?: string | null;
          google_maps?: string | null;
          id?: string;
          icp_fit?: number | null;
          linkedin_decisor?: string | null;
          linkedin_empresa?: string | null;
          mapa_people_em?: string | null;
          modelo_usado?: string | null;
          n_avaliacoes?: number | null;
          nome_decisor?: string | null;
          nota_google?: number | null;
          notas?: string | null;
          objecao?: string | null;
          origem?: string | null;
          papel_contato?: string | null;
          pessoas_chave?: string | null;
          perdido_motivo?: string | null;
          primeiro_contato_em?: string | null;
          prioridade?: string;
          proposta_enviada_em?: string | null;
          proximo_followup?: string | null;
          proximo_passo?: string | null;
          respondeu_em?: string | null;
          responsavel?: string;
          resposta_objecao?: string | null;
          segmento?: string | null;
          sinal_compra?: string | null;
          sinal_data?: string | null;
          sinal_detalhe?: string | null;
          status?: string;
          tags?: string[];
          tamanho_time?: string | null;
          telefone?: string | null;
          ultima_interacao?: string | null;
          website?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      estrategias_mensagem: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          corpo: string;
          criado_em: string;
          id: string;
          objetivo: string;
          quando_enviar: string;
          sinal: string;
          titulo: string;
          toque: number;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          corpo: string;
          criado_em?: string;
          id?: string;
          objetivo: string;
          quando_enviar: string;
          sinal: string;
          titulo: string;
          toque: number;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          corpo?: string;
          criado_em?: string;
          id?: string;
          objetivo?: string;
          quando_enviar?: string;
          sinal?: string;
          titulo?: string;
          toque?: number;
        };
        Relationships: [];
      };
      importacoes_leads: {
        Row: {
          arquivo: string | null;
          atualizados: number;
          criado_em: string;
          id: string;
          ignorados: number;
          modo: string;
          novos: number;
          snapshot: Json;
          total_anterior: number;
        };
        Insert: {
          arquivo?: string | null;
          atualizados?: number;
          criado_em?: string;
          id?: string;
          ignorados?: number;
          modo: string;
          novos?: number;
          snapshot?: Json;
          total_anterior?: number;
        };
        Update: {
          arquivo?: string | null;
          atualizados?: number;
          criado_em?: string;
          id?: string;
          ignorados?: number;
          modo?: string;
          novos?: number;
          snapshot?: Json;
          total_anterior?: number;
        };
        Relationships: [];
      };
      modelos_mensagem: {
        Row: {
          atualizado_em: string;
          canal: string;
          corpo: string;
          criado_em: string;
          id: string;
          segmento: string;
          titulo: string;
        };
        Insert: {
          atualizado_em?: string;
          canal: string;
          corpo: string;
          criado_em?: string;
          id?: string;
          segmento: string;
          titulo: string;
        };
        Update: {
          atualizado_em?: string;
          canal?: string;
          corpo?: string;
          criado_em?: string;
          id?: string;
          segmento?: string;
          titulo?: string;
        };
        Relationships: [];
      };
      visoes_salvas: {
        Row: {
          criado_em: string;
          filtros: Json;
          id: string;
          nome: string;
        };
        Insert: {
          criado_em?: string;
          filtros?: Json;
          id?: string;
          nome: string;
        };
        Update: {
          criado_em?: string;
          filtros?: Json;
          id?: string;
          nome?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
