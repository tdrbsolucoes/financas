import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// SQL para criar as tabelas
const CREATE_TABLES_SQL = `
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
  phone text,
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

-- Índices
CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON contacts (user_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions (user_id);
CREATE INDEX IF NOT EXISTS transactions_contact_id_idx ON transactions (contact_id);
CREATE INDEX IF NOT EXISTS transactions_due_date_idx ON transactions (due_date);
`

// Função para verificar se as tabelas existem
async function checkTables() {
  try {
    const { error: contactsError } = await supabase.from('contacts').select('id').limit(1)
    const { error: transactionsError } = await supabase.from('transactions').select('id').limit(1)
    
    return !contactsError && !transactionsError
  } catch {
    return false
  }
}

// Função para criar as tabelas
async function createTables() {
  try {
    console.log('🔧 Criando tabelas do banco de dados...')
    
    // Tenta usar RPC para executar SQL
    const { error } = await supabase.rpc('exec_sql', { 
      sql_query: CREATE_TABLES_SQL 
    })
    
    if (error) {
      console.log('❌ Erro ao executar SQL via RPC:', error.message)
      console.log('\n📋 Execute este SQL manualmente no Supabase Dashboard:')
      console.log('=' .repeat(60))
      console.log(CREATE_TABLES_SQL)
      console.log('=' .repeat(60))
      return false
    }
    
    console.log('✅ Tabelas criadas com sucesso!')
    return true
    
  } catch (error) {
    console.log('❌ Erro inesperado:', error.message)
    return false
  }
}

// Função principal
async function setupDatabase() {
  console.log('🚀 Verificando banco de dados...')
  
  const tablesExist = await checkTables()
  
  if (tablesExist) {
    console.log('✅ Tabelas já existem no banco de dados')
    return true
  }
  
  console.log('⚠️ Tabelas não encontradas, criando...')
  const created = await createTables()
  
  if (created) {
    // Verifica novamente se foram criadas
    const verified = await checkTables()
    if (verified) {
      console.log('✅ Banco de dados configurado com sucesso!')
      return true
    }
  }
  
  console.log('❌ Falha na configuração automática do banco')
  return false
}

// Exporta as funções
export { setupDatabase, checkTables, CREATE_TABLES_SQL }

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
}