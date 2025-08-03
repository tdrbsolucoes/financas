-- Remove tabelas e tipos existentes para garantir uma migração limpa (ideal para desenvolvimento)
-- Habilita a extensão uuid-ossp se ainda não estiver habilitada, para a função uuid_generate_v4()
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
  -- Usando JSONB para agrupar os dados de cobrança recorrente
  recurring_charge jsonb
);
comment on table public.contacts is 'Tabela para armazenar contatos, que podem ser clientes ou empresas.';
comment on column public.contacts.recurring_charge is 'Armazena dados de cobrança recorrente como um objeto JSON. Ex: {"isActive": true, "amount": 150.00, "launchDay": 10, "dueDay": 20}';

alter table public.contacts enable row level security;
drop policy if exists "Users can manage their own contacts." on public.contacts;
create policy "Users can manage their own contacts." on public.contacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Adiciona índices para otimizar consultas
create index if not exists contacts_user_id_idx on public.contacts (user_id);

-- Tabela principal para as transações financeiras (lançamentos)
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
comment on table public.transactions is 'Tabela para armazenar todas as transações financeiras (entradas e saídas).';

alter table public.transactions enable row level security;
drop policy if exists "Users can manage their own transactions." on public.transactions;
create policy "Users can manage their own transactions." on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Adiciona índices para otimizar consultas
create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_contact_id_idx on public.transactions (contact_id);
create index if not exists transactions_due_date_idx on public.transactions (due_date);
