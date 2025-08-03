// Sistema de migrações automáticas para Supabase
import { supabase } from '../supabaseClient'

export interface Migration {
  id: string
  name: string
  sql: string
  description: string
}

// Lista de todas as migrações em ordem
export const migrations: Migration[] = [
  {
    id: '001',
    name: 'initial_schema',
    description: 'Criação das tabelas iniciais (contacts e transactions)',
    sql: `
-- Habilita a extensão uuid-ossp se ainda não estiver habilitada
create extension if not exists "uuid-ossp" with schema extensions;

-- Cria os tipos ENUM de forma segura, apenas se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_type') THEN
        CREATE TYPE public.contact_type AS ENUM ('empresa', 'cliente');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
    END IF;
END$$;

-- Tabela para os contatos (empresas e clientes)
create table if not exists public.contacts (
  id uuid not null default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamp with time zone not null default now(),
  name text not null,
  type contact_type not null,
  email text,
  recurring_charge jsonb
);

comment on table public.contacts is 'Tabela para armazenar contatos, que podem ser clientes ou empresas.';
comment on column public.contacts.recurring_charge is 'Armazena dados de cobrança recorrente como um objeto JSON.';

-- Habilita RLS na tabela contacts
alter table public.contacts enable row level security;

-- Remove política existente se houver
drop policy if exists "Users can manage their own contacts." on public.contacts;

-- Cria política para contacts
create policy "Users can manage their own contacts." on public.contacts 
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Índices para otimizar consultas
create index if not exists contacts_user_id_idx on public.contacts (user_id);

-- Tabela principal para as transações financeiras
create table if not exists public.transactions (
  id uuid not null default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamp with time zone not null default now(),
  description text not null,
  amount numeric(10, 2) not null,
  date date not null,
  due_date date not null,
  type transaction_type not null,
  is_paid boolean not null default false,
  paid_date date,
  is_recurring boolean not null default false,
  contact_id uuid references public.contacts(id) on delete set null
);

comment on table public.transactions is 'Tabela para armazenar todas as transações financeiras.';

-- Habilita RLS na tabela transactions
alter table public.transactions enable row level security;

-- Remove política existente se houver
drop policy if exists "Users can manage their own transactions." on public.transactions;

-- Cria política para transactions
create policy "Users can manage their own transactions." on public.transactions 
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Índices para otimizar consultas
create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_contact_id_idx on public.transactions (contact_id);
create index if not exists transactions_due_date_idx on public.transactions (due_date);

-- Tabela para controle de migrações
create table if not exists public.schema_migrations (
  id text primary key,
  name text not null,
  description text,
  applied_at timestamp with time zone not null default now()
);

-- Habilita RLS na tabela de migrações (apenas leitura para todos)
alter table public.schema_migrations enable row level security;

-- Política para permitir leitura das migrações para usuários autenticados
drop policy if exists "Anyone can read migrations." on public.schema_migrations;
create policy "Anyone can read migrations." on public.schema_migrations 
for select using (true);
    `
  }
]

export class MigrationService {
  
  // Verifica se as tabelas existem
  async checkTablesExist(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id')
        .limit(1)
      
      return !error
    } catch {
      return false
    }
  }

  // Executa uma migração usando a função RPC do Supabase
  async executeMigration(migration: Migration): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Executando migração: ${migration.name}`)
      
      // Executa o SQL usando a função rpc do Supabase
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: migration.sql 
      })
      
      if (error) {
        // Se a função RPC não existir, tentamos criar as tabelas via REST API
        if (error.code === '42883') {
          return await this.executeMigrationFallback(migration)
        }
        throw error
      }

      // Registra a migração como aplicada
      await this.recordMigration(migration)
      
      console.log(`✅ Migração ${migration.name} executada com sucesso`)
      return { success: true }
      
    } catch (error: any) {
      console.error(`❌ Erro na migração ${migration.name}:`, error)
      return { success: false, error: error.message }
    }
  }

  // Método alternativo para executar migrações
  private async executeMigrationFallback(migration: Migration): Promise<{ success: boolean; error?: string }> {
    try {
      // Para a migração inicial, vamos criar as tabelas usando comandos individuais
      if (migration.id === '001') {
        return await this.createInitialTables()
      }
      
      return { success: false, error: 'Método de migração não suportado' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Cria as tabelas iniciais usando a API REST do Supabase
  private async createInitialTables(): Promise<{ success: boolean; error?: string }> {
    try {
      // Nota: Este método é limitado, mas funciona para casos básicos
      // O ideal é usar o SQL Editor do Supabase Dashboard para migrações complexas
      
      console.log('📝 Criando estrutura básica do banco...')
      
      // Tenta criar uma entrada de teste para verificar se as tabelas existem
      const { error: contactsError } = await supabase
        .from('contacts')
        .select('id')
        .limit(1)
      
      if (contactsError && contactsError.code === '42P01') {
        // Tabela não existe - precisamos criá-la via SQL Editor
        throw new Error('TABLES_NOT_FOUND')
      }
      
      // Se chegou aqui, as tabelas já existem
      await this.recordMigration(migrations[0])
      return { success: true }
      
    } catch (error: any) {
      if (error.message === 'TABLES_NOT_FOUND') {
        return { 
          success: false, 
          error: 'Tabelas não encontradas. Execute o SQL no Supabase Dashboard primeiro.' 
        }
      }
      return { success: false, error: error.message }
    }
  }

  // Registra que uma migração foi aplicada
  private async recordMigration(migration: Migration): Promise<void> {
    try {
      await supabase
        .from('schema_migrations')
        .upsert({
          id: migration.id,
          name: migration.name,
          description: migration.description
        })
    } catch (error) {
      // Se não conseguir registrar, não é crítico
      console.warn('Não foi possível registrar a migração:', error)
    }
  }

  // Verifica quais migrações já foram aplicadas
  async getAppliedMigrations(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('schema_migrations')
        .select('id')
      
      if (error) return []
      
      return data?.map(m => m.id) || []
    } catch {
      return []
    }
  }

  // Executa todas as migrações pendentes
  async runPendingMigrations(): Promise<{ success: boolean; results: any[] }> {
    const appliedMigrations = await this.getAppliedMigrations()
    const pendingMigrations = migrations.filter(m => !appliedMigrations.includes(m.id))
    
    if (pendingMigrations.length === 0) {
      console.log('✨ Banco de dados já está atualizado')
      return { success: true, results: [] }
    }
    
    console.log(`🔄 Executando ${pendingMigrations.length} migração(ões) pendente(s)...`)
    
    const results = []
    let allSuccessful = true
    
    for (const migration of pendingMigrations) {
      const result = await this.executeMigration(migration)
      results.push({ migration: migration.name, ...result })
      
      if (!result.success) {
        allSuccessful = false
        break
      }
    }
    
    return { success: allSuccessful, results }
  }

  // Força a recriação das tabelas (cuidado!)
  async resetDatabase(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('⚠️ ATENÇÃO: Resetando banco de dados...')
      
      // Remove todas as tabelas
      const dropSQL = `
        DROP TABLE IF EXISTS public.transactions CASCADE;
        DROP TABLE IF EXISTS public.contacts CASCADE;
        DROP TABLE IF EXISTS public.schema_migrations CASCADE;
        DROP TYPE IF EXISTS public.transaction_type CASCADE;
        DROP TYPE IF EXISTS public.contact_type CASCADE;
      `
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: dropSQL })
      
      if (error && error.code !== '42883') {
        throw error
      }
      
      // Executa a migração inicial
      const result = await this.executeMigration(migrations[0])
      
      if (result.success) {
        console.log('✅ Banco de dados resetado com sucesso')
      }
      
      return result
      
    } catch (error: any) {
      console.error('❌ Erro ao resetar banco:', error)
      return { success: false, error: error.message }
    }
  }
}

export const migrationService = new MigrationService()