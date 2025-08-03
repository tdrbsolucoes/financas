import React, { useState, useEffect } from 'react'
import { migrationService } from '../database/migrations'
import { Database, CheckCircle, AlertCircle, RefreshCw, Play } from 'lucide-react'

interface DatabaseSetupProps {
  onSetupComplete: () => void
}

const DatabaseSetup: React.FC<DatabaseSetupProps> = ({ onSetupComplete }) => {
  const [status, setStatus] = useState<'checking' | 'needs-setup' | 'setting-up' | 'complete' | 'error'>('checking')
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [showManualInstructions, setShowManualInstructions] = useState(false)

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const checkDatabaseStatus = async () => {
    try {
      setStatus('checking')
      addLog('Verificando status do banco de dados...')
      
      const tablesExist = await migrationService.checkTablesExist()
      
      if (tablesExist) {
        addLog('✅ Tabelas encontradas no banco de dados')
        setStatus('complete')
        onSetupComplete()
      } else {
        addLog('⚠️ Tabelas não encontradas - configuração necessária')
        setStatus('needs-setup')
      }
    } catch (error: any) {
      addLog(`❌ Erro ao verificar banco: ${error.message}`)
      setError(error.message)
      setStatus('error')
    }
  }

  const runMigrations = async () => {
    try {
      setStatus('setting-up')
      setError('')
      addLog('🚀 Iniciando configuração do banco de dados...')
      
      const result = await migrationService.runPendingMigrations()
      
      if (result.success) {
        addLog('✅ Banco de dados configurado com sucesso!')
        setStatus('complete')
        setTimeout(() => {
          onSetupComplete()
        }, 2000)
      } else {
        const errorMsg = result.results.find(r => !r.success)?.error || 'Erro desconhecido'
        addLog(`❌ Falha na configuração: ${errorMsg}`)
        
        if (errorMsg.includes('Tabelas não encontradas')) {
          setShowManualInstructions(true)
        }
        
        setError(errorMsg)
        setStatus('error')
      }
    } catch (error: any) {
      addLog(`❌ Erro inesperado: ${error.message}`)
      setError(error.message)
      setStatus('error')
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="animate-spin" size={24} />
      case 'needs-setup':
        return <AlertCircle size={24} />
      case 'setting-up':
        return <RefreshCw className="animate-spin" size={24} />
      case 'complete':
        return <CheckCircle size={24} />
      case 'error':
        return <AlertCircle size={24} />
      default:
        return <Database size={24} />
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        return 'Verificando configuração do banco de dados...'
      case 'needs-setup':
        return 'Banco de dados precisa ser configurado'
      case 'setting-up':
        return 'Configurando banco de dados...'
      case 'complete':
        return 'Banco de dados configurado com sucesso!'
      case 'error':
        return 'Erro na configuração do banco de dados'
      default:
        return 'Status desconhecido'
    }
  }

  return (
    <div className="login-container">
      <div className="login-box" style={{ maxWidth: '600px' }}>
        <div className="logo-container">
          <div className="logo">F</div>
          <h1>Finanças</h1>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
            {getStatusIcon()}
          </div>
          <h2>{getStatusMessage()}</h2>
        </div>

        {status === 'needs-setup' && (
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--muted-foreground)' }}>
              O sistema precisa configurar as tabelas do banco de dados para funcionar corretamente.
            </p>
            <button 
              className="login-button"
              onClick={runMigrations}
            >
              <Play size={16} style={{ marginRight: '0.5rem' }} />
              Configurar Banco de Dados
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ marginBottom: '2rem' }}>
            <div className="error-message">
              {error}
            </div>
            
            {!showManualInstructions ? (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="login-button" 
                  onClick={runMigrations}
                  style={{ flex: 1 }}
                >
                  Tentar Novamente
                </button>
                <button 
                  className="google-login-button" 
                  onClick={() => setShowManualInstructions(true)}
                  style={{ flex: 1 }}
                >
                  Configuração Manual
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ marginBottom: '1rem' }}>📋 Configuração Manual</h3>
                <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
                  Execute este SQL no Supabase Dashboard (SQL Editor):
                </p>
                <div style={{ 
                  background: 'var(--muted)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius)', 
                  fontSize: '0.8rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  marginBottom: '1rem'
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`-- Execute este código no SQL Editor do Supabase:

create extension if not exists "uuid-ossp";

CREATE TYPE contact_type AS ENUM ('empresa', 'cliente');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

create table contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  created_at timestamptz default now(),
  name text not null,
  type contact_type not null,
  email text,
  recurring_charge jsonb
);

create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  created_at timestamptz default now(),
  description text not null,
  amount numeric(10,2) not null,
  date date not null,
  due_date date not null,
  type transaction_type not null,
  is_paid boolean default false,
  paid_date date,
  is_recurring boolean default false,
  contact_id uuid references contacts(id)
);

alter table contacts enable row level security;
alter table transactions enable row level security;

create policy "Users manage own contacts" on contacts
  for all using (auth.uid() = user_id);

create policy "Users manage own transactions" on transactions
  for all using (auth.uid() = user_id);`}
                  </pre>
                </div>
                <button 
                  className="login-button"
                  onClick={checkDatabaseStatus}
                >
                  Verificar Novamente
                </button>
              </div>
            )}
          </div>
        )}

        {status === 'complete' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
              Redirecionando para o sistema...
            </p>
          </div>
        )}

        {logs.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <details>
              <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
                Ver logs de configuração
              </summary>
              <div style={{ 
                background: 'var(--muted)', 
                padding: '1rem', 
                borderRadius: 'var(--radius)', 
                fontSize: '0.8rem',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {logs.map((log, index) => (
                  <div key={index} style={{ marginBottom: '0.25rem' }}>
                    {log}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}

export default DatabaseSetup