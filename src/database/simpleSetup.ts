import { supabase } from '../supabaseClient'

export class SimpleSetup {
  
  // SQL direto para criar as tabelas - sem complicação
  private readonly SQL_SETUP = `
-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos ENUM
DO $$ BEGIN
    CREATE TYPE contact_type AS ENUM ('empresa', 'cliente');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela contacts
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  type contact_type NOT NULL,
  email text,
  recurring_charge jsonb
);

-- Tabela transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  date date NOT NULL,
  due_date date NOT NULL,
  type transaction_type NOT NULL,
  is_paid boolean DEFAULT false,
  paid_date date,
  is_recurring boolean DEFAULT false,
  contact_id uuid REFERENCES contacts(id)
);

-- RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "contacts_policy" ON contacts;
CREATE POLICY "contacts_policy" ON contacts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_policy" ON transactions;
CREATE POLICY "transactions_policy" ON transactions FOR ALL USING (auth.uid() = user_id);
  `

  // Verifica se tabelas existem
  async checkTables(): Promise<boolean> {
    try {
      const { error } = await supabase.from('contacts').select('id').limit(1)
      return !error
    } catch {
      return false
    }
  }

  // Cria as tabelas usando RPC
  async createTables(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 Criando tabelas...')
      
      // Tenta usar RPC primeiro
      const { error: rpcError } = await supabase.rpc('exec_sql', { 
        sql_query: this.SQL_SETUP 
      })
      
      if (!rpcError) {
        console.log('✅ Tabelas criadas via RPC')
        return { success: true }
      }
      
      // Se RPC falhar, retorna erro específico
      console.log('❌ RPC falhou:', rpcError.message)
      return { 
        success: false, 
        error: 'Execute o SQL manualmente no Supabase Dashboard' 
      }
      
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Processo completo
  async setup(): Promise<{ success: boolean; error?: string; needsManual?: boolean }> {
    try {
      // 1. Verifica se já existem
      const tablesExist = await this.checkTables()
      if (tablesExist) {
        return { success: true }
      }
      
      // 2. Tenta criar
      const result = await this.createTables()
      if (result.success) {
        // 3. Verifica se realmente criou
        const created = await this.checkTables()
        if (created) {
          return { success: true }
        }
      }
      
      // 4. Se chegou aqui, precisa de configuração manual
      return { 
        success: false, 
        error: result.error || 'Falha na criação',
        needsManual: true 
      }
      
    } catch (error: any) {
      return { success: false, error: error.message, needsManual: true }
    }
  }

  // Retorna o SQL para configuração manual
  getManualSQL(): string {
    return this.SQL_SETUP
  }
}

export const simpleSetup = new SimpleSetup()