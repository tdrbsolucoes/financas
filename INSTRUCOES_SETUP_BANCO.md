# Instruções para Configurar o Banco de Dados Supabase

## ❌ Problema Identificado
A conexão direta com o banco Supabase não está funcionando devido a restrições de rede no ambiente atual. 

## ✅ Solução: Executar SQL Manualmente no Supabase

### Passo 1: Acesse o Supabase Dashboard
1. Vá para [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto

### Passo 2: Abra o SQL Editor
1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"**

### Passo 3: Execute o Script de Criação das Tabelas
Copie e cole o seguinte SQL no editor e execute:

```sql
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
```

### Passo 4: Verificar se as Tabelas foram Criadas
1. No menu lateral, clique em **"Table Editor"**
2. Você deve ver as tabelas `contacts` e `transactions` listadas

### Passo 5: Configurar Autenticação (se necessário)
1. Vá para **Authentication** → **Providers**
2. Certifique-se de que **Email** está habilitado
3. Se necessário, habilite **"Enable email confirmations"** ou desabilite se quiser login direto

### Passo 6: Obter as Credenciais
1. Vá para **Settings** → **API**
2. Copie:
   - **Project URL** (para `VITE_SUPABASE_URL`)
   - **anon public** key (para `VITE_SUPABASE_ANON_KEY`)

### Passo 7: Atualizar o arquivo .env
Atualize o arquivo `.env` com suas credenciais reais:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

## ✅ Após Executar o SQL
Depois de executar o SQL no Supabase Dashboard, o sistema estará pronto para uso. As tabelas estarão criadas com:

- ✅ **Tabela contacts**: Para empresas e clientes
- ✅ **Tabela transactions**: Para receitas e despesas  
- ✅ **RLS habilitado**: Segurança por usuário
- ✅ **Índices criados**: Para performance
- ✅ **Políticas de segurança**: Cada usuário vê apenas seus dados

## 🚀 Testando o Sistema
1. Inicie o servidor: `npm run dev`
2. Acesse a aplicação no navegador
3. Crie uma conta ou faça login
4. Teste as funcionalidades de contatos e transações

## 📞 Suporte
Se ainda houver problemas:
1. Verifique se as credenciais no `.env` estão corretas
2. Confirme se as tabelas foram criadas no Table Editor
3. Verifique se a autenticação por email está habilitada