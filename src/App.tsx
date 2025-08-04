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
}

function App() {
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
      <div className="login-container">
        <div className="login-box">
          <div className="logo-container">
            <div className="logo">F</div>
            <h1>Finanças</h1>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>
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
      <div className="login-container">
        <div className="login-box" style={{ maxWidth: '700px' }}>
          <div className="logo-container">
            <div className="logo">F</div>
            <h1>Finanças</h1>
          </div>
          <div className="error-message">
            <h3>⚠️ Tabelas do banco não encontradas</h3>
            <p>Execute este comando na raiz do projeto:</p>
            <div style={{ 
              background: 'var(--muted)', 
              padding: '1rem', 
              borderRadius: 'var(--radius)', 
              fontSize: '0.9rem',
              marginTop: '1rem',
              fontFamily: 'monospace'
            }}>
              <code>node setupDatabase.js</code>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
              Ou execute o SQL manualmente no Supabase Dashboard:
            </p>
            <div style={{ 
              background: 'var(--muted)', 
              padding: '1rem', 
              borderRadius: 'var(--radius)', 
              fontSize: '0.8rem',
              maxHeight: '200px',
              overflowY: 'auto',
              marginTop: '1rem',
              fontFamily: 'monospace'
            }}>
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
              className="login-button"
              onClick={() => window.location.reload()}
              style={{ marginTop: '1rem' }}
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
      if (error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
        setShowDatabaseError(true)
        return
      }
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
          <h2>
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