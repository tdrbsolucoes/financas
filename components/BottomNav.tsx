import React from 'react'
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  FileText 
} from 'lucide-react'

interface BottomNavProps {
  currentPage: string
  onPageChange: (page: 'dashboard' | 'contacts' | 'financial' | 'reports') => void
}

const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onPageChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'contacts', label: 'Contatos1', icon: Users },
    { id: 'newcontacts', label: 'Contatos', icon: Users },
    { id: 'newcontacts', label: 'Contatos', icon: Users },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'reports', label: 'Relatórios', icon: FileText },
  ]

  return (
    <nav className="bottom-nav">
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
  )
}

export default BottomNav