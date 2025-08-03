import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginForm } from './components/LoginForm'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { Contacts } from './pages/Contacts'
import { Reports } from './pages/Reports'

function AppContent() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="logo-container">
            <div className="logo">F</div>
            <h1>Finanças</h1>
          </div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'transactions':
        return <Transactions />
      case 'contacts':
        return <Contacts />
      case 'reports':
        return <Reports />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="main-content">
        {renderPage()}
      </div>
      
      {/* Bottom Navigation for Mobile */}
      <nav className="bottom-nav">
        <ul>
          <li>
            <a
              href="#"
              className={currentPage === 'dashboard' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault()
                setCurrentPage('dashboard')
              }}
            >
              <span>📊</span>
              Dashboard
            </a>
          </li>
          <li>
            <a
              href="#"
              className={currentPage === 'transactions' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault()
                setCurrentPage('transactions')
              }}
            >
              <span>💰</span>
              Transações
            </a>
          </li>
          <li>
            <a
              href="#"
              className={currentPage === 'contacts' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault()
                setCurrentPage('contacts')
              }}
            >
              <span>👥</span>
              Contatos
            </a>
          </li>
          <li>
            <a
              href="#"
              className={currentPage === 'reports' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault()
                setCurrentPage('reports')
              }}
            >
              <span>📈</span>
              Relatórios
            </a>
          </li>
        </ul>
      </nav>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App