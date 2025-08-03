import React, { useState, useEffect } from 'react'
import { autoMigrationService } from '../database/autoMigration'
import { Database, CheckCircle, AlertCircle, RefreshCw, Play, Code } from 'lucide-react'

interface AutoDatabaseSetupProps {
  onSetupComplete: () => void
}

const AutoDatabaseSetup: React.FC<AutoDatabaseSetupProps> = ({ onSetupComplete }) => {
  const [status, setStatus] = useState<'checking' | 'ready' | 'needs-setup' | 'setting-up' | 'complete' | 'error'>('checking')
  const [message, setMessage] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [showManualSQL, setShowManualSQL] = useState(false)
  const [sqlContent, setSqlContent] = useState('')

  useEffect(() => {
    initializeDatabase()
  }, [])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `${timestamp}: ${message}`])
  }

  const initializeDatabase = async () => {
    try {
      setStatus('checking')
      addLog('🔍 Verificando se o banco está pronto...')
      
      // Primeiro verifica se já está pronto
      const isReady = await autoMigrationService.isDatabaseReady()
      
      if (isReady) {
        addLog('✅ Banco de dados já está configurado!')
        setStatus('complete')
        setMessage('Banco de dados pronto!')
        setTimeout(() => onSetupComplete(), 1500)
        return
      }
      
      addLog('⚠️ Banco precisa ser configurado')
      setStatus('needs-setup')
      setMessage('Banco de dados precisa ser inicializado')
      
    } catch (error: any) {
      addLog(`❌ Erro na verificação: ${error.message}`)
      setStatus('error')
      setMessage('Erro ao verificar banco de dados')
    }
  }

  const runAutoSetup = async () => {
    try {
      setStatus('setting-up')
      setMessage('Configurando banco automaticamente...')
      addLog('🚀 Iniciando configuração automática...')
      
      const result = await autoMigrationService.autoInitializeDatabase()
      addLog(`📊 Resultado da configuração: ${JSON.stringify(result)}`)
      
      if (result.success) {
        addLog('✅ Configuração automática concluída!')
        setStatus('complete')
        setMessage(result.message)
        setTimeout(() => onSetupComplete(), 2000)
      } else {
        addLog(`❌ Falha na configuração automática: ${result.message}`)
        
        // Verifica se é um problema de tabelas não criadas
        if (result.message.includes('Tabela') || result.message.includes('tabela')) {
          addLog('💡 Problema identificado: Tabelas não foram criadas automaticamente')
          addLog('🔧 Solução: Execute o SQL manualmente no Supabase Dashboard')
        }
        
        setStatus('error')
        setMessage(result.message)
        
        if (result.needsManualSetup && result.sqlContent) {
          addLog('📋 Preparando instruções para configuração manual...')
          setSqlContent(result.sqlContent)
          setShowManualSQL(true)
        }
      }
      
    } catch (error: any) {
      addLog(`❌ Erro inesperado: ${error.message}`)
      setStatus('error')
      setMessage('Erro na configuração automática')
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
        return 'Verificando banco de dados...'
      case 'needs-setup':
        return 'Banco precisa ser configurado'
      case 'setting-up':
        return 'Configurando automaticamente...'
      case 'complete':
        return 'Banco configurado com sucesso!'
      case 'error':
        return 'Erro na configuração'
      default:
        return 'Verificando sistema...'
    }
  }

  return (
    <div className="login-container">
      <div className="login-box" style={{ maxWidth: '700px' }}>
        <div className="logo-container">
          <div className="logo">F</div>
          <h1>Finanças</h1>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
            {getStatusIcon()}
          </div>
          <h2>{getStatusMessage()}</h2>
          {message && (
            <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
              {message}
            </p>
          )}
        </div>

        {status === 'needs-setup' && (
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--muted-foreground)' }}>
              O sistema detectou que o banco precisa ser configurado. 
              Clique no botão abaixo para configurar automaticamente.
            </p>
            <button 
              className="login-button"
              onClick={runAutoSetup}
            >
              <Play size={16} style={{ marginRight: '0.5rem' }} />
              Configurar Automaticamente
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ marginBottom: '2rem' }}>
            <div className="error-message">
              {message}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                className="login-button" 
                onClick={runAutoSetup}
                style={{ flex: 1 }}
              >
                Tentar Novamente
              </button>
              
              {!showManualSQL && (
                <button 
                  className="google-login-button" 
                  onClick={() => setShowManualSQL(true)}
                  style={{ flex: 1 }}
                >
                  <Code size={16} style={{ marginRight: '0.5rem' }} />
                  Configuração Manual
                </button>
              )}
            </div>

            {showManualSQL && sqlContent && (
              <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Code size={20} />
                  Configuração Manual
                </h3>
                <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
                  Execute este SQL no Supabase Dashboard → SQL Editor:
                </p>
                <div style={{ 
                  background: 'var(--muted)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius)', 
                  fontSize: '0.75rem',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  marginBottom: '1rem',
                  fontFamily: 'monospace'
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {sqlContent}
                  </pre>
                </div>
                <button 
                  className="login-button"
                  onClick={initializeDatabase}
                >
                  <RefreshCw size={16} style={{ marginRight: '0.5rem' }} />
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
              <summary style={{ cursor: 'pointer', marginBottom: '1rem', color: 'var(--muted-foreground)' }}>
                📋 Ver logs detalhados ({logs.length})
              </summary>
              <div style={{ 
                background: 'var(--muted)', 
                padding: '1rem', 
                borderRadius: 'var(--radius)', 
                fontSize: '0.8rem',
                maxHeight: '200px',
                overflowY: 'auto',
                fontFamily: 'monospace'
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

export default AutoDatabaseSetup