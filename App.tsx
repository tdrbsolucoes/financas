import React, { useState, useEffect } from 'react'
import { authService, supabase } from './src/lib/supabase'
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
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  useEffect(() => {
    // Verificar se há usuário logado
    const checkUser = async () => {
      const { user } = await authService.getCurrentUser()
      setUser(user)
      setLoading(false)
    }

    checkUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await authService.signOut()
    setUser(null)
    setCurrentPage('dashboard')
  }

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