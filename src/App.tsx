import React, { useState, useEffect } from 'react'
import { authService } from './supabaseClient'
import { simpleSetup } from './database/simpleSetup'
import { User } from '@supabase/supabase-js'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import ContactsPage from './components/ContactsPage'
import FinancialPage from './components/FinancialPage'
import ReportsPage from './components/ReportsPage'

type Page = 'dashboard' | 'contacts' | 'financial' | 'reports'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [databaseReady, setDatabaseReady] = useState(false)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { user } = await authService.getCurrentUser()
        setUser(user)
        
        // Verificar e configurar banco automaticamente
        const setupResult = await simpleSetup.setup()
        
        setDatabaseReady(setupResult.success)
        
      } catch (error) {
        setDatabaseReady(false)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
    
    // Escutar mudanças de autenticação
    const subscription = authService.onAuthStateChange((user) => {
      setUser(user)
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

  // Se o banco não está configurado, mostrar mensagem
  if (!databaseReady) {
    return (
      <div className="login-container">
        <div className="login-box" style={{ maxWidth: '600px' }}>
          <div className="logo-container">
            <div className="logo">F</div>
            <h1>Finanças</h1>
          </div>
          <div className="error-message">
            <h3>⚠️ Banco de dados não configurado</h3>
            <p>Execute este SQL no Supabase Dashboard (SQL Editor):</p>
            <div style={{ 
              background: 'var(--muted)', 
              padding: '1rem', 
              borderRadius: 'var(--radius)', 
              fontSize: '0.8rem',
              maxHeight: '300px',
              overflowY: 'auto',
              marginTop: '1rem',
              fontFamily: 'monospace'
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {simpleSetup.getManualSQL()}
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
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} />
      case 'contacts':
        return <ContactsPage user={user} />
      case 'financial':
        return <FinancialPage user={user} />
      case 'reports':
        return <ReportsPage user={user} />
      default:
        return <Dashboard user={user} />
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