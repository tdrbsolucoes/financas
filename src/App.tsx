import React, { useState, useEffect } from 'react'
import { authService } from './supabaseClient'
import { autoMigrationService } from './database/autoMigration'
import { autoMigrationService } from './database/autoMigration'
import { User } from '@supabase/supabase-js'
import LoginPage from './components/LoginPage'
import AutoDatabaseSetup from './components/AutoDatabaseSetup'
import AutoDatabaseSetup from './components/AutoDatabaseSetup'
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
  const [databaseReady, setDatabaseReady] = useState(false)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Verificar usuário logado
        const { user } = await authService.getCurrentUser()
        setUser(user)
        
        // 2. Verificar/configurar banco automaticamente
        const isDatabaseReady = await autoMigrationService.isDatabaseReady()
        setDatabaseReady(isDatabaseReady)
        
      } catch (error) {
        console.error('Erro na inicialização:', error)
        setDatabaseReady(false)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
    const initializeApp = async () => {
      try {
        // 1. Verificar usuário logado
        const { user } = await authService.getCurrentUser()
        setUser(user)
        
        // 2. Verificar/configurar banco automaticamente
        const isDatabaseReady = await autoMigrationService.isDatabaseReady()
        setDatabaseReady(isDatabaseReady)
        
      } catch (error) {
        console.error('Erro na inicialização:', error)
        setDatabaseReady(false)
      } finally {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await authService.signOut()
    setUser(null)
    setCurrentPage('dashboard')
  }

  const handleDatabaseSetupComplete = () => {
    setDatabaseReady(true)
  }

  const handleDatabaseSetupComplete = () => {
    setDatabaseReady(true)
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

  // Se o banco não está configurado, mostrar tela de setup automático
  if (!databaseReady) {
    return <AutoDatabaseSetup onSetupComplete={handleDatabaseSetupComplete} />
  }

  // Se o banco não está configurado, mostrar tela de setup automático
  if (!databaseReady) {
    return <AutoDatabaseSetup onSetupComplete={handleDatabaseSetupComplete} />
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
    initializeApp()
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