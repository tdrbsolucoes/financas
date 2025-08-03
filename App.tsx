import React, { useState, useEffect } from 'react'
import { authService, supabase } from './supabaseClient'
import { migrationService } from './src/database/migrations'
import DatabaseSetup from './src/components/DatabaseSetup'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import ContactsPage from './components/ContactsPage'
import FinancialPage from './components/FinancialPage'
import ReportsPage from './components/ReportsPage'
import { User } from '@supabase/supabase-js'

type Page = 'dashboard' | 'contacts' | 'financial' | 'reports'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [databaseReady, setDatabaseReady] = useState(false)
  const [checkingDatabase, setCheckingDatabase] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Primeiro verificar se o banco está configurado
        const tablesExist = await migrationService.checkTablesExist()
        setDatabaseReady(tablesExist)
        setCheckingDatabase(false)
        
        if (tablesExist) {
          // Se o banco está pronto, verificar usuário logado
          const { user } = await authService.getCurrentUser()
          setUser(user)
        }
      } catch (error) {
        console.error('Erro ao inicializar aplicação:', error)
        setDatabaseReady(false)
        setCheckingDatabase(false)
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

  const handleDatabaseReady = () => {
    setDatabaseReady(true)
    // Recarregar a página para inicializar com o banco pronto
    window.location.reload()
  }

  const handleLogout = async () => {
    await authService.signOut()
    setUser(null)
    setCurrentPage('dashboard')
  }

  if (loading || checkingDatabase) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="logo-container">
            <div className="logo">F</div>
            <h1>Finanças</h1>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>
            {checkingDatabase ? 'Verificando banco de dados...' : 'Carregando...'}
          </p>
        </div>
      </div>
    )
  }

  if (!databaseReady) {
    return <DatabaseSetup onDatabaseReady={handleDatabaseReady} />
  }

  if (!user) {
    return <LoginPage />
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