import React from 'react'
import { useAuth } from '../contexts/AuthContext'

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const { signOut } = useAuth()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'transactions', label: 'Transações', icon: '💰' },
    { id: 'contacts', label: 'Contatos', icon: '👥' },
    { id: 'reports', label: 'Relatórios', icon: '📈' },
  ]

  return (
    <div className="sidebar">
      <div>
        <div className="sidebar-header">
          <div className="logo">F</div>
          <h1>Finanças</h1>
        </div>
        
        <nav>
          <ul>
            {menuItems.map((item) => (
              <li key={item.id}>
                <a
                  href="#"
                  className={currentPage === item.id ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(item.id)
                  }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      <button className="logout-button" onClick={signOut}>
        <span>🚪</span>
        Sair
      </button>
    </div>
  )
}