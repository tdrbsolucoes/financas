import React from 'react'
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  FileText, 
  LogOut 
} from 'lucide-react'

interface SidebarProps {
  currentPage: string
  onPageChange: (page: 'dashboard' | 'contacts' | 'financial' | 'reports') => void
  onLogout: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'contacts', label: 'Contatos', icon: Users },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'reports', label: 'Relatórios', icon: FileText },
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
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <a
                    href="#"
                    className={currentPage === item.id ? 'active' : ''}
                    onClick={(e) => {
                      e.preventDefault()
                      onPageChange(item.id as any)
                    }}
                  >
                    <Icon />
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
      
      <button className="logout-button" onClick={onLogout}>
        <LogOut />
        Sair
      </button>
    </div>
  )
}

export default Sidebar