export interface Database {
  public: {
    Tables: {
      perfis: {
        Row: {
          id: string
          nome_completo: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          nome_completo?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          nome_completo?: string | null
          avatar_url?: string | null
        }
      }
      contatos: {
        Row: {
          id: string
          user_id: string
          criado_em: string
          nome: string
          tipo: 'empresa' | 'cliente'
          email: string | null
          cobranca_recorrente_ativa: boolean | null
          cobranca_recorrente_valor: number | null
          cobranca_recorrente_dia_lancamento: number | null
          cobranca_recorrente_dia_vencimento: number | null
        }
        Insert: {
          id?: string
          user_id: string
          criado_em?: string
          nome: string
          tipo: 'empresa' | 'cliente'
          email?: string | null
          cobranca_recorrente_ativa?: boolean | null
          cobranca_recorrente_valor?: number | null
          cobranca_recorrente_dia_lancamento?: number | null
          cobranca_recorrente_dia_vencimento?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          criado_em?: string
          nome?: string
          tipo?: 'empresa' | 'cliente'
          email?: string | null
          cobranca_recorrente_ativa?: boolean | null
          cobranca_recorrente_valor?: number | null
          cobranca_recorrente_dia_lancamento?: number | null
          cobranca_recorrente_dia_vencimento?: number | null
        }
      }
      transacoes: {
        Row: {
          id: number
          user_id: string
          criado_em: string
          descricao: string | null
          valor: number
          data_lancamento: string
          data_vencimento: string
          tipo: 'income' | 'expense'
          pago: boolean
          data_pagamento: string | null
          recorrente: boolean | null
          contato_id: string | null
        }
        Insert: {
          id?: number
          user_id: string
          criado_em?: string
          descricao?: string | null
          valor: number
          data_lancamento: string
          data_vencimento: string
          tipo: 'income' | 'expense'
          pago?: boolean
          data_pagamento?: string | null
          recorrente?: boolean | null
          contato_id?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          criado_em?: string
          descricao?: string | null
          valor?: number
          data_lancamento?: string
          data_vencimento?: string
          tipo?: 'income' | 'expense'
          pago?: boolean
          data_pagamento?: string | null
          recorrente?: boolean | null
          contato_id?: string | null
        }
      }
    }
  }
}