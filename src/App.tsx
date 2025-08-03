import React, { useState, useEffect } from 'react'
import { authService } from './supabaseClient'
import { autoMigrationService } from './database/autoMigration'
import { User } from '@supabase/supabase-js'
import LoginPage from './components/LoginPage'
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
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Iniciando verificação do sistema...')
        
        // 1. Verificar usuário logado
        const { user } = await authService.getCurrentUser()
        setUser(user)
        console.log('👤 Usuário verificado:', user ? 'Logado' : 'Não logado')
        
        // 2. Verificar se banco está pronto
        const isDatabaseReady = await autoMigrationService.isDatabaseReady()
        console.log('🗄️ Status do banco:', isDatabaseReady ? 'Pronto' : 'Precisa configurar')
        
        if (!isDatabaseReady) {
          console.log('🔧 Tentando configurar banco automaticamente...')
          const setupResult = await autoMigrationService.autoInitializeDatabase()
          console.log('📊 Resultado da configuração:', setupResult)
          
          if (setupResult.success) {
            console.log('✅ Banco configurado automaticamente!')
            setDatabaseReady(true)
          } else {
            console.log('⚠️ Configuração automática falhou, mostrando tela de setup')
            setDatabaseReady(false)
          }
        } else {
          console.log('✅ Banco já estava pronto!')
          setDatabaseReady(true)
        }
        
      } catch (error) {
        console.error('❌ Erro na inicialização:', error)
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

  const handleLogout = async () => {
    await authService.signOut()
    setUser(null)
    setCurrentPage('dashboard')
  }

  const handleDatabaseSetupComplete = () => {
    console.log('✅ Setup do banco concluído!')
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