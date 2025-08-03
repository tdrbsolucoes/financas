import React, { useState, useEffect } from 'react'
import { authService, supabase } from './supabaseClient'
import { migrationService } from './database/migrations'
import LoginPage from './components/LoginPage'
import DatabaseSetup from './components/DatabaseSetup'
import Dashboard from './components/Dashboard'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [databaseReady, setDatabaseReady] = useState(false)
  const [checkingDatabase, setCheckingDatabase] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  useEffect(() => {
    // Verificar usuário e banco de dados
    const initializeApp = async () => {
      try {
        // Verificar usuário logado
        const { user } = await authService.getCurrentUser()
        setUser(user)
        
        // Verificar se o banco está configurado
        const tablesExist = await migrationService.checkTablesExist()
        setDatabaseReady(tablesExist)
        
      } catch (error) {
        console.error('Erro na inicialização:', error)
        setDatabaseReady(false)
      } finally {
        setLoading(false)
        setCheckingDatabase(false)
      }
    }

    initializeApp()

    // Escutar mudanças de autenticação
    setCurrentPage('dashboard')
  }, [])

  const handleDatabaseSetupComplete = () => {
    setDatabaseReady(true)
  }

  if (loading || checkingDatabase) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>
            {checkingDatabase ? 'Verificando sistema...' : 'Carregando...'}
          </p>
        </div>
      </div>
    )
  }

  // Se o banco não está configurado, mostrar tela de setup
  if (!databaseReady) {
    return <DatabaseSetup onSetupComplete={handleDatabaseSetupComplete} />
  }

  if (!user) {
    return <LoginPage />
  }
}