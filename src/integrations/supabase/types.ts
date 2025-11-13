export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ads_eventos: {
        Row: {
          acao: string
          ad_id: string | null
          dados_ad: Json | null
          id: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          acao: string
          ad_id?: string | null
          dados_ad?: Json | null
          id?: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          acao?: string
          ad_id?: string | null
          dados_ad?: Json | null
          id?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_eventos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analise_comportamento_psicologica: {
        Row: {
          data_analise: string | null
          data_atualizacao: string | null
          descricao_perfil: string | null
          id: string
          mes_ano: string
          padrao_dia_semana: string | null
          padrao_hora: string | null
          perfil_tipo: string | null
          pontos_fortes: string[] | null
          pontos_fracos: string[] | null
          recomendacoes: string[] | null
          resumo_analise: string | null
          sazonalidade: string | null
          score_consciencia: number | null
          score_controle: number | null
          score_geral: number | null
          score_planejamento: number | null
          triggers_principais: Json | null
          user_id: string
        }
        Insert: {
          data_analise?: string | null
          data_atualizacao?: string | null
          descricao_perfil?: string | null
          id?: string
          mes_ano: string
          padrao_dia_semana?: string | null
          padrao_hora?: string | null
          perfil_tipo?: string | null
          pontos_fortes?: string[] | null
          pontos_fracos?: string[] | null
          recomendacoes?: string[] | null
          resumo_analise?: string | null
          sazonalidade?: string | null
          score_consciencia?: number | null
          score_controle?: number | null
          score_geral?: number | null
          score_planejamento?: number | null
          triggers_principais?: Json | null
          user_id: string
        }
        Update: {
          data_analise?: string | null
          data_atualizacao?: string | null
          descricao_perfil?: string | null
          id?: string
          mes_ano?: string
          padrao_dia_semana?: string | null
          padrao_hora?: string | null
          perfil_tipo?: string | null
          pontos_fortes?: string[] | null
          pontos_fracos?: string[] | null
          recomendacoes?: string[] | null
          resumo_analise?: string | null
          sazonalidade?: string | null
          score_consciencia?: number | null
          score_controle?: number | null
          score_geral?: number | null
          score_planejamento?: number | null
          triggers_principais?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analise_comportamento_psicologica_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bancos_contas: {
        Row: {
          agencia: string | null
          ativo: boolean | null
          conectada_api: boolean | null
          data_atualizacao: string | null
          data_criacao: string | null
          finalidade: string | null
          id: string
          moeda: string | null
          nome_banco: string
          numero_conta: string | null
          principal: boolean | null
          renda_compartilhada_id: string | null
          saldo_atual: number
          saldo_inicial: number | null
          tipo_conta: string
          token_api_encrypted: string | null
          ultimo_sync: string | null
          user_id: string
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean | null
          conectada_api?: boolean | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          finalidade?: string | null
          id?: string
          moeda?: string | null
          nome_banco: string
          numero_conta?: string | null
          principal?: boolean | null
          renda_compartilhada_id?: string | null
          saldo_atual?: number
          saldo_inicial?: number | null
          tipo_conta: string
          token_api_encrypted?: string | null
          ultimo_sync?: string | null
          user_id: string
        }
        Update: {
          agencia?: string | null
          ativo?: boolean | null
          conectada_api?: boolean | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          finalidade?: string | null
          id?: string
          moeda?: string | null
          nome_banco?: string
          numero_conta?: string | null
          principal?: boolean | null
          renda_compartilhada_id?: string | null
          saldo_atual?: number
          saldo_inicial?: number | null
          tipo_conta?: string
          token_api_encrypted?: string | null
          ultimo_sync?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bancos_contas_renda_compartilhada_id_fkey"
            columns: ["renda_compartilhada_id"]
            isOneToOne: false
            referencedRelation: "renda_compartilhada"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bancos_contas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_saidas: {
        Row: {
          ativo: boolean | null
          cor: string | null
          data_atualizacao: string | null
          data_criacao: string | null
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          padrao: boolean | null
          tipo: string
          user_id: string
          valor_esperado: number | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          padrao?: boolean | null
          tipo: string
          user_id: string
          valor_esperado?: number | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          padrao?: boolean | null
          tipo?: string
          user_id?: string
          valor_esperado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_saidas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_historico_completo: {
        Row: {
          acoes_sugeridas: string[] | null
          data_atualizacao: string | null
          data_criacao: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          mensagens: Json[] | null
          padroes_financeiros: string[] | null
          resumo_conversa: string | null
          sentimentos_detectados: string[] | null
          topico: string | null
          topicos_identificados: string[] | null
          user_id: string
        }
        Insert: {
          acoes_sugeridas?: string[] | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          mensagens?: Json[] | null
          padroes_financeiros?: string[] | null
          resumo_conversa?: string | null
          sentimentos_detectados?: string[] | null
          topico?: string | null
          topicos_identificados?: string[] | null
          user_id: string
        }
        Update: {
          acoes_sugeridas?: string[] | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          mensagens?: Json[] | null
          padroes_financeiros?: string[] | null
          resumo_conversa?: string | null
          sentimentos_detectados?: string[] | null
          topico?: string | null
          topicos_identificados?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_historico_completo_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracao_onboarding: {
        Row: {
          categorias_selecionadas: string[] | null
          data_conclusao: string | null
          data_criacao: string | null
          gasto_diario_personalizado: number | null
          gasto_diario_recomendado: number | null
          id: string
          metas_iniciais: Json | null
          onboarding_completo: boolean | null
          renda_mensal: number | null
          saldo_inicial: number | null
          step_atual: number | null
          user_id: string
        }
        Insert: {
          categorias_selecionadas?: string[] | null
          data_conclusao?: string | null
          data_criacao?: string | null
          gasto_diario_personalizado?: number | null
          gasto_diario_recomendado?: number | null
          id?: string
          metas_iniciais?: Json | null
          onboarding_completo?: boolean | null
          renda_mensal?: number | null
          saldo_inicial?: number | null
          step_atual?: number | null
          user_id: string
        }
        Update: {
          categorias_selecionadas?: string[] | null
          data_conclusao?: string | null
          data_criacao?: string | null
          gasto_diario_personalizado?: number | null
          gasto_diario_recomendado?: number | null
          id?: string
          metas_iniciais?: Json | null
          onboarding_completo?: boolean | null
          renda_mensal?: number | null
          saldo_inicial?: number | null
          step_atual?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracao_onboarding_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracao_saldo_usuario: {
        Row: {
          data_atualizacao: string | null
          data_criacao: string | null
          id: string
          percentual_limite_amarelo: number | null
          percentual_limite_verde: number | null
          percentual_limite_vermelho: number | null
          renda_mensal: number
          user_id: string
        }
        Insert: {
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: string
          percentual_limite_amarelo?: number | null
          percentual_limite_verde?: number | null
          percentual_limite_vermelho?: number | null
          renda_mensal: number
          user_id: string
        }
        Update: {
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: string
          percentual_limite_amarelo?: number | null
          percentual_limite_verde?: number | null
          percentual_limite_vermelho?: number | null
          renda_mensal?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracao_saldo_usuario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracao_usuario: {
        Row: {
          agressividade_sugestoes: number | null
          data_atualizacao: string | null
          data_criacao: string | null
          eh_freelancer: boolean | null
          estilo_usuario: string | null
          frequencia_alertas: string | null
          frequencia_notificacoes: string | null
          gasto_diario_personalizado: number | null
          gasto_diario_recomendado: number | null
          horario_notificacao: string | null
          id: string
          idioma: string | null
          moeda_principal: string | null
          quer_alertas: boolean | null
          quer_recomendacoes_automaticas: boolean | null
          renda_maxima_freelancer: number | null
          renda_mensal: number
          renda_minima_freelancer: number | null
          reserva_emergencia_atual: number | null
          reserva_emergencia_meta: number | null
          tema_preferido: string | null
          tipo_profissao: string | null
          tone_ia: string | null
          user_id: string
        }
        Insert: {
          agressividade_sugestoes?: number | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          eh_freelancer?: boolean | null
          estilo_usuario?: string | null
          frequencia_alertas?: string | null
          frequencia_notificacoes?: string | null
          gasto_diario_personalizado?: number | null
          gasto_diario_recomendado?: number | null
          horario_notificacao?: string | null
          id?: string
          idioma?: string | null
          moeda_principal?: string | null
          quer_alertas?: boolean | null
          quer_recomendacoes_automaticas?: boolean | null
          renda_maxima_freelancer?: number | null
          renda_mensal: number
          renda_minima_freelancer?: number | null
          reserva_emergencia_atual?: number | null
          reserva_emergencia_meta?: number | null
          tema_preferido?: string | null
          tipo_profissao?: string | null
          tone_ia?: string | null
          user_id: string
        }
        Update: {
          agressividade_sugestoes?: number | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          eh_freelancer?: boolean | null
          estilo_usuario?: string | null
          frequencia_alertas?: string | null
          frequencia_notificacoes?: string | null
          gasto_diario_personalizado?: number | null
          gasto_diario_recomendado?: number | null
          horario_notificacao?: string | null
          id?: string
          idioma?: string | null
          moeda_principal?: string | null
          quer_alertas?: boolean | null
          quer_recomendacoes_automaticas?: boolean | null
          renda_maxima_freelancer?: number | null
          renda_mensal?: number
          renda_minima_freelancer?: number | null
          reserva_emergencia_atual?: number | null
          reserva_emergencia_meta?: number | null
          tema_preferido?: string | null
          tipo_profissao?: string | null
          tone_ia?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracao_usuario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacoes_historicas: {
        Row: {
          data_cotacao: string
          fonte: string | null
          hora_atualizacao: string | null
          id: string
          moeda_destino: string
          moeda_origem: string
          taxa_conversao: number
        }
        Insert: {
          data_cotacao: string
          fonte?: string | null
          hora_atualizacao?: string | null
          id?: string
          moeda_destino: string
          moeda_origem: string
          taxa_conversao: number
        }
        Update: {
          data_cotacao?: string
          fonte?: string | null
          hora_atualizacao?: string | null
          id?: string
          moeda_destino?: string
          moeda_origem?: string
          taxa_conversao?: number
        }
        Relationships: []
      }
      feedback_usuario: {
        Row: {
          data_criacao: string | null
          id: string
          lido: boolean | null
          mensagem: string
          rating: number | null
          tipo: string
          titulo: string | null
          user_id: string
        }
        Insert: {
          data_criacao?: string | null
          id?: string
          lido?: boolean | null
          mensagem: string
          rating?: number | null
          tipo: string
          titulo?: string | null
          user_id: string
        }
        Update: {
          data_criacao?: string | null
          id?: string
          lido?: boolean | null
          mensagem?: string
          rating?: number | null
          tipo?: string
          titulo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_usuario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      insights_diarios: {
        Row: {
          aviso_ia: string | null
          categoria_predominante: string | null
          data: string
          data_geracao: string | null
          dica_ia: string | null
          gasto_diario: number | null
          gasto_medio_historico: number | null
          id: string
          mes_financeiro_id: string | null
          num_transacoes: number | null
          score_dia: number | null
          tendencia: string | null
          user_id: string
        }
        Insert: {
          aviso_ia?: string | null
          categoria_predominante?: string | null
          data: string
          data_geracao?: string | null
          dica_ia?: string | null
          gasto_diario?: number | null
          gasto_medio_historico?: number | null
          id?: string
          mes_financeiro_id?: string | null
          num_transacoes?: number | null
          score_dia?: number | null
          tendencia?: string | null
          user_id: string
        }
        Update: {
          aviso_ia?: string | null
          categoria_predominante?: string | null
          data?: string
          data_geracao?: string | null
          dica_ia?: string | null
          gasto_diario?: number | null
          gasto_medio_historico?: number | null
          id?: string
          mes_financeiro_id?: string | null
          num_transacoes?: number | null
          score_dia?: number | null
          tendencia?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_diarios_mes_financeiro_id_fkey"
            columns: ["mes_financeiro_id"]
            isOneToOne: false
            referencedRelation: "meses_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_diarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      investimentos: {
        Row: {
          ativo: boolean | null
          data_atualizacao: string | null
          data_criacao: string | null
          data_investimento: string | null
          descricao: string | null
          id: string
          moeda: string | null
          nome: string
          notas: string | null
          taxa_rendimento: number | null
          tipo: string
          user_id: string
          valor_atual: number
          valor_inicial: number
        }
        Insert: {
          ativo?: boolean | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_investimento?: string | null
          descricao?: string | null
          id?: string
          moeda?: string | null
          nome: string
          notas?: string | null
          taxa_rendimento?: number | null
          tipo: string
          user_id: string
          valor_atual: number
          valor_inicial: number
        }
        Update: {
          ativo?: boolean | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_investimento?: string | null
          descricao?: string | null
          id?: string
          moeda?: string | null
          nome?: string
          notas?: string | null
          taxa_rendimento?: number | null
          tipo?: string
          user_id?: string
          valor_atual?: number
          valor_inicial?: number
        }
        Relationships: [
          {
            foreignKeyName: "investimentos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meses_financeiros: {
        Row: {
          ano: number
          data_abertura: string | null
          data_atualizacao: string | null
          data_criacao: string | null
          data_fechamento: string | null
          id: string
          mes: number
          patrimonio_total: number | null
          saldo_final: number | null
          saldo_inicial: number | null
          status: string
          total_diario: number | null
          total_entradas: number | null
          total_saidas: number | null
          user_id: string
        }
        Insert: {
          ano: number
          data_abertura?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_fechamento?: string | null
          id?: string
          mes: number
          patrimonio_total?: number | null
          saldo_final?: number | null
          saldo_inicial?: number | null
          status?: string
          total_diario?: number | null
          total_entradas?: number | null
          total_saidas?: number | null
          user_id: string
        }
        Update: {
          ano?: number
          data_abertura?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_fechamento?: string | null
          id?: string
          mes?: number
          patrimonio_total?: number | null
          saldo_final?: number | null
          saldo_inicial?: number | null
          status?: string
          total_diario?: number | null
          total_entradas?: number | null
          total_saidas?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meses_financeiros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_gastos: {
        Row: {
          alerta_percentual: number | null
          ativo: boolean | null
          categoria_id: string
          data_atualizacao: string | null
          data_criacao: string | null
          id: string
          limite_maximo: number
          mes_ano: string
          user_id: string
        }
        Insert: {
          alerta_percentual?: number | null
          ativo?: boolean | null
          categoria_id: string
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: string
          limite_maximo: number
          mes_ano: string
          user_id: string
        }
        Update: {
          alerta_percentual?: number | null
          ativo?: boolean | null
          categoria_id?: string
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: string
          limite_maximo?: number
          mes_ano?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_gastos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_saidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_gastos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_usuario: {
        Row: {
          conteudo: string | null
          data_criacao: string | null
          data_leitura: string | null
          id: string
          lido: boolean | null
          tipo: string
          titulo: string | null
          user_id: string
        }
        Insert: {
          conteudo?: string | null
          data_criacao?: string | null
          data_leitura?: string | null
          id?: string
          lido?: boolean | null
          tipo: string
          titulo?: string | null
          user_id: string
        }
        Update: {
          conteudo?: string | null
          data_criacao?: string | null
          data_leitura?: string | null
          id?: string
          lido?: boolean | null
          tipo?: string
          titulo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_usuario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      observacoes_gastos: {
        Row: {
          analise_ia: string | null
          compulsivo: boolean | null
          contexto: string | null
          data_atualizacao: string | null
          data_criacao: string | null
          gasto_necessario: boolean | null
          gasto_prazeroso: boolean | null
          id: string
          observacao: string | null
          peso_psicologico: number | null
          pode_evitar_proximo_mes: boolean | null
          sentimento: string | null
          transacao_id: string
        }
        Insert: {
          analise_ia?: string | null
          compulsivo?: boolean | null
          contexto?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          gasto_necessario?: boolean | null
          gasto_prazeroso?: boolean | null
          id?: string
          observacao?: string | null
          peso_psicologico?: number | null
          pode_evitar_proximo_mes?: boolean | null
          sentimento?: string | null
          transacao_id: string
        }
        Update: {
          analise_ia?: string | null
          compulsivo?: boolean | null
          contexto?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          gasto_necessario?: boolean | null
          gasto_prazeroso?: boolean | null
          id?: string
          observacao?: string | null
          peso_psicologico?: number | null
          pode_evitar_proximo_mes?: boolean | null
          sentimento?: string | null
          transacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "observacoes_gastos_transacao_id_fkey"
            columns: ["transacao_id"]
            isOneToOne: true
            referencedRelation: "transacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      projecoes_financeiras: {
        Row: {
          data_compra: string | null
          data_criacao: string | null
          data_execucao: string | null
          descricao: string | null
          executada: boolean | null
          financiado: boolean | null
          gasto_mensal_projetado: number | null
          id: string
          impacto_percentual: number | null
          insight_ia: string | null
          mes_financeiro_id: string | null
          moeda: string | null
          nome: string
          num_parcelas: number | null
          saldo_atual: number | null
          saldo_projetado: number | null
          salva: boolean | null
          status: string | null
          taxa_juros: number | null
          user_id: string
          valor_compra: number
          valor_parcela: number | null
        }
        Insert: {
          data_compra?: string | null
          data_criacao?: string | null
          data_execucao?: string | null
          descricao?: string | null
          executada?: boolean | null
          financiado?: boolean | null
          gasto_mensal_projetado?: number | null
          id?: string
          impacto_percentual?: number | null
          insight_ia?: string | null
          mes_financeiro_id?: string | null
          moeda?: string | null
          nome: string
          num_parcelas?: number | null
          saldo_atual?: number | null
          saldo_projetado?: number | null
          salva?: boolean | null
          status?: string | null
          taxa_juros?: number | null
          user_id: string
          valor_compra: number
          valor_parcela?: number | null
        }
        Update: {
          data_compra?: string | null
          data_criacao?: string | null
          data_execucao?: string | null
          descricao?: string | null
          executada?: boolean | null
          financiado?: boolean | null
          gasto_mensal_projetado?: number | null
          id?: string
          impacto_percentual?: number | null
          insight_ia?: string | null
          mes_financeiro_id?: string | null
          moeda?: string | null
          nome?: string
          num_parcelas?: number | null
          saldo_atual?: number | null
          saldo_projetado?: number | null
          salva?: boolean | null
          status?: string | null
          taxa_juros?: number | null
          user_id?: string
          valor_compra?: number
          valor_parcela?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projecoes_financeiras_mes_financeiro_id_fkey"
            columns: ["mes_financeiro_id"]
            isOneToOne: false
            referencedRelation: "meses_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projecoes_financeiras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      renda_compartilhada: {
        Row: {
          ativo: boolean | null
          criado_por: string
          data_atualizacao: string | null
          data_criacao: string | null
          grupo_id: string | null
          id: string
          nome_grupo: string | null
          renda_total: number
          tipo: string
        }
        Insert: {
          ativo?: boolean | null
          criado_por: string
          data_atualizacao?: string | null
          data_criacao?: string | null
          grupo_id?: string | null
          id?: string
          nome_grupo?: string | null
          renda_total: number
          tipo: string
        }
        Update: {
          ativo?: boolean | null
          criado_por?: string
          data_atualizacao?: string | null
          data_criacao?: string | null
          grupo_id?: string | null
          id?: string
          nome_grupo?: string | null
          renda_total?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "renda_compartilhada_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      renda_compartilhada_membros: {
        Row: {
          ativo: boolean | null
          confirmado: boolean | null
          data_atualizacao: string | null
          data_confirmacao: string | null
          data_criacao: string | null
          id: string
          nome_membro: string | null
          percentual_renda: number | null
          pode_deletar: boolean | null
          pode_editar: boolean | null
          pode_visualizar: boolean | null
          renda_compartilhada_id: string
          user_id: string
          valor_renda: number | null
          visualizar_apenas_seu: boolean | null
        }
        Insert: {
          ativo?: boolean | null
          confirmado?: boolean | null
          data_atualizacao?: string | null
          data_confirmacao?: string | null
          data_criacao?: string | null
          id?: string
          nome_membro?: string | null
          percentual_renda?: number | null
          pode_deletar?: boolean | null
          pode_editar?: boolean | null
          pode_visualizar?: boolean | null
          renda_compartilhada_id: string
          user_id: string
          valor_renda?: number | null
          visualizar_apenas_seu?: boolean | null
        }
        Update: {
          ativo?: boolean | null
          confirmado?: boolean | null
          data_atualizacao?: string | null
          data_confirmacao?: string | null
          data_criacao?: string | null
          id?: string
          nome_membro?: string | null
          percentual_renda?: number | null
          pode_deletar?: boolean | null
          pode_editar?: boolean | null
          pode_visualizar?: boolean | null
          renda_compartilhada_id?: string
          user_id?: string
          valor_renda?: number | null
          visualizar_apenas_seu?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "renda_compartilhada_membros_renda_compartilhada_id_fkey"
            columns: ["renda_compartilhada_id"]
            isOneToOne: false
            referencedRelation: "renda_compartilhada"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renda_compartilhada_membros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes: {
        Row: {
          banco_conta_id: string | null
          categoria_id: string | null
          data_atualizacao: string | null
          data_cotacao: string | null
          data_criacao: string | null
          deletado: boolean | null
          descricao: string
          dia: number
          editado_manualmente: boolean | null
          id: string
          mes_financeiro_id: string
          moeda_base: string | null
          moeda_original: string | null
          recorrente: boolean | null
          recorrente_id: string | null
          taxa_conversao: number | null
          tipo: string
          user_id: string
          valor_convertido: number | null
          valor_original: number
        }
        Insert: {
          banco_conta_id?: string | null
          categoria_id?: string | null
          data_atualizacao?: string | null
          data_cotacao?: string | null
          data_criacao?: string | null
          deletado?: boolean | null
          descricao: string
          dia: number
          editado_manualmente?: boolean | null
          id?: string
          mes_financeiro_id: string
          moeda_base?: string | null
          moeda_original?: string | null
          recorrente?: boolean | null
          recorrente_id?: string | null
          taxa_conversao?: number | null
          tipo: string
          user_id: string
          valor_convertido?: number | null
          valor_original: number
        }
        Update: {
          banco_conta_id?: string | null
          categoria_id?: string | null
          data_atualizacao?: string | null
          data_cotacao?: string | null
          data_criacao?: string | null
          deletado?: boolean | null
          descricao?: string
          dia?: number
          editado_manualmente?: boolean | null
          id?: string
          mes_financeiro_id?: string
          moeda_base?: string | null
          moeda_original?: string | null
          recorrente?: boolean | null
          recorrente_id?: string | null
          taxa_conversao?: number | null
          tipo?: string
          user_id?: string
          valor_convertido?: number | null
          valor_original?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_banco_conta_id_fkey"
            columns: ["banco_conta_id"]
            isOneToOne: false
            referencedRelation: "bancos_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_saidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_mes_financeiro_id_fkey"
            columns: ["mes_financeiro_id"]
            isOneToOne: false
            referencedRelation: "meses_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes_recorrentes: {
        Row: {
          ativo: boolean | null
          categoria_id: string | null
          data_atualizacao: string | null
          data_criacao: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string
          dia_mes: number | null
          dia_semana: number | null
          frequencia: string
          id: string
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          categoria_id?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao: string
          dia_mes?: number | null
          dia_semana?: number | null
          frequencia: string
          id?: string
          tipo: string
          user_id: string
          valor: number
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string
          dia_mes?: number | null
          dia_semana?: number | null
          frequencia?: string
          id?: string
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_recorrentes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_saidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_recorrentes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          ativo: boolean | null
          data_atualizacao: string | null
          data_criacao: string | null
          device_name: string | null
          device_os: string | null
          device_type: string
          id: string
          push_token: string | null
          ultimo_acesso: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          device_name?: string | null
          device_os?: string | null
          device_type: string
          id?: string
          push_token?: string | null
          ultimo_acesso?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          device_name?: string | null
          device_os?: string | null
          device_type?: string
          id?: string
          push_token?: string | null
          ultimo_acesso?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          data_atualizacao: string | null
          data_criacao: string | null
          id: string
          idioma: string | null
          notificacoes_ativadas: boolean | null
          notificacoes_email: boolean | null
          notificacoes_push: boolean | null
          perfil_publico: boolean | null
          permitir_coleta_dados: boolean | null
          tema: string | null
          user_id: string
        }
        Insert: {
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: string
          idioma?: string | null
          notificacoes_ativadas?: boolean | null
          notificacoes_email?: boolean | null
          notificacoes_push?: boolean | null
          perfil_publico?: boolean | null
          permitir_coleta_dados?: boolean | null
          tema?: string | null
          user_id: string
        }
        Update: {
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: string
          idioma?: string | null
          notificacoes_ativadas?: boolean | null
          notificacoes_email?: boolean | null
          notificacoes_push?: boolean | null
          perfil_publico?: boolean | null
          permitir_coleta_dados?: boolean | null
          tema?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          aceita_lgpd: boolean | null
          aceita_xapi_logs: boolean | null
          apple_id: string | null
          ativo: boolean | null
          data_atualizacao: string | null
          data_criacao: string | null
          data_nascimento: string | null
          email: string
          email_verificado: boolean | null
          foto_perfil: string | null
          google_id: string | null
          id: string
          microsoft_id: string | null
          nome_completo: string
          pais: string | null
          password_hash: string | null
          timezone: string | null
          ultimo_acesso: string | null
        }
        Insert: {
          aceita_lgpd?: boolean | null
          aceita_xapi_logs?: boolean | null
          apple_id?: string | null
          ativo?: boolean | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_nascimento?: string | null
          email: string
          email_verificado?: boolean | null
          foto_perfil?: string | null
          google_id?: string | null
          id?: string
          microsoft_id?: string | null
          nome_completo: string
          pais?: string | null
          password_hash?: string | null
          timezone?: string | null
          ultimo_acesso?: string | null
        }
        Update: {
          aceita_lgpd?: boolean | null
          aceita_xapi_logs?: boolean | null
          apple_id?: string | null
          ativo?: boolean | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_nascimento?: string | null
          email?: string
          email_verificado?: boolean | null
          foto_perfil?: string | null
          google_id?: string | null
          id?: string
          microsoft_id?: string | null
          nome_completo?: string
          pais?: string | null
          password_hash?: string | null
          timezone?: string | null
          ultimo_acesso?: string | null
        }
        Relationships: []
      }
      xapi_logs: {
        Row: {
          acao: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          descricao: string | null
          id: string
          ip_address: unknown
          permitir_coleta: boolean | null
          timestamp: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          acao: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string | null
          id?: string
          ip_address?: unknown
          permitir_coleta?: boolean | null
          timestamp?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          acao?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string | null
          id?: string
          ip_address?: unknown
          permitir_coleta?: boolean | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xapi_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
