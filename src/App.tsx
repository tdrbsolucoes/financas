import React, { useState, useEffect } from 'react'
import { authService, supabase } from './lib/supabase'
import { User } from '@supabase/supabase-js'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import ContactsPage from './components/ContactsPage'
import FinancialPage from './components/FinancialPage'
import ReportsPage from './components/ReportsPage'

type Page = 'dashboard' | 'contacts' | 'financial' | 'reports'

// Componente para mostrar erro de banco não configurado
function DatabaseError() {
  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-container">
          <div className="logo">⚠️</div>
          <h1>Banco não configurado</h1>
        </div>
        <div style={{ textAlign: 'left', marginTop: '20px' }}>
          <p><strong>As tabelas do banco não foram criadas ainda.</strong></p>
          <p>Para resolver, execute um dos comandos abaixo:</p>
          
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '8px', 
            margin: '15px 0',
            fontFamily: 'monospace'
          }}>
            npm run setup-db
          </div>
          
          <p><strong>Ou copie e execute este SQL no Supabase Dashboard:</strong></p>
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '8px', 
            margin: '15px 0',
            fontFamily: 'monospace',
            fontSize: '12px',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {`-- Extensão UUID
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
CREATE POLICY "contacts_policy" ON contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "transactions_policy" ON transactions FOR ALL USING (auth.uid() = user_id);`}
          </div>
          
          <button 
            onClick={() => window.location.reload()} 
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '15px'
            }}
          >
            Verificar Novamente
          </button>
        </div>
      </div>
    </div>
  )
  onDatabaseError?: (error: any) => void
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [databaseReady, setDatabaseReady] = useState<boolean | null>(null)
  const [showDatabaseError, setShowDatabaseError] = useState(false)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Verificar se as tabelas existem
        const { error: contactsError } = await supabase
          .from('contacts')
          .select('id')
          .limit(1)
        
        const { error: transactionsError } = await supabase
          .from('transactions')
          .select('id')
          .limit(1)
        
        const tablesExist = !contactsError && !transactionsError
        setDatabaseReady(tablesExist)
        
        if (tablesExist) {
          // Verificar usuário logado apenas se o banco estiver pronto
          const { user } = await authService.getCurrentUser()
          setUser(user)
        }
      } catch (error) {
        console.error('Erro ao verificar banco:', error)
        setDatabaseReady(false)
        console.error('Erro ao verificar usuário:', error)
      } finally {
        setLoading(false)
      }
    }
    initializeApp()
    
    // Escutar mudanças de autenticação
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="w-full h-screen grid place-items-center bg-background">
        <div className="w-full max-w-md p-10 bg-card border border-border rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="text-2xl bg-primary text-primary-foreground rounded-lg w-10 h-10 grid place-items-center font-bold">F</div>
            <h1>Finanças</h1>
          </div>
          <p className="text-center text-muted-foreground">
            Carregando...
          </p>
        </div>
      </div>
    )
  }

  // Se o banco não estiver configurado, mostrar tela de erro
  if (databaseReady === false) {
    return <DatabaseError />
  }

  // Verificar se há erro de banco (tabelas não existem)
  if (showDatabaseError) {
    return (
      <div className="w-full h-screen grid place-items-center bg-background">
        <div className="w-full max-w-3xl p-10 bg-card border border-border rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="text-2xl bg-primary text-primary-foreground rounded-lg w-10 h-10 grid place-items-center font-bold">F</div>
            <h1>Finanças</h1>
          </div>
          <div className="bg-destructive/20 text-destructive p-3 rounded-lg mb-4 text-center text-sm">
            <h3 className="text-lg font-semibold mb-4">⚠️ Tabelas do banco não encontradas</h3>
            <p>Execute este comando na raiz do projeto:</p>
            <div className="bg-muted p-4 rounded-lg text-sm mt-4 font-mono">
              <code>node setupDatabase.js</code>
            </div>
            <p className="mt-4 text-sm">
              Ou execute o SQL manualmente no Supabase Dashboard:
            </p>
            <div className="bg-muted p-4 rounded-lg text-xs max-h-48 overflow-y-auto mt-4 font-mono">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE contact_type AS ENUM ('empresa', 'cliente');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  type contact_type NOT NULL,
  email text,
  recurring_charge jsonb
);

CREATE TABLE transactions (
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

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_policy" ON contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "transactions_policy" ON transactions FOR ALL USING (auth.uid() = user_id);`}
              </pre>
            </div>
            <button 
              className="w-full p-3 border-none rounded-lg bg-primary text-primary-foreground text-base font-semibold cursor-pointer transition-all hover:brightness-110 mt-4"
              onClick={() => window.location.reload()}
            >
              Verificar Novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  const handleLogout = async () => {
    await authService.signOut()
    setUser(null)
    setCurrentPage('dashboard')
  }

  const renderCurrentPage = () => {
    // Interceptar erros de tabelas não encontradas
    const handleDatabaseError = (error: any) => {
      throw error
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} onDatabaseError={handleDatabaseError} />
      case 'contacts':
        return <ContactsPage user={user} onDatabaseError={handleDatabaseError} />
      case 'financial':
        return <FinancialPage user={user} onDatabaseError={handleDatabaseError} />
      case 'reports':
        return <ReportsPage user={user} onDatabaseError={handleDatabaseError} />
      default:
        return <Dashboard user={user} onDatabaseError={handleDatabaseError} />
    }
  }

  return (
    <div className="app-container">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        onLogout={handleLogout}
      />
      
      <div className="main-content">
        <div className="header">
          <h2 className="text-3xl font-bold">
            {currentPage === 'dashboard' && 'Dashboard'}
            {currentPage === 'contacts' && 'Contatos'}
            {currentPage === 'financial' && 'Financeiro'}
            {currentPage === 'reports' && 'Relatórios'}
          </h2>
        </div>
        
        <div className="page-content">
          {renderCurrentPage()}
        </div>
      </div>
      <BottomNav 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
      />
    </div>
  )
}

export default App