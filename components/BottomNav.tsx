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
    { id: 'contacts', label: 'Contatos', icon: Users },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'reports', label: 'Relatórios', icon: FileText },
  ]

  return (
    <nav className="block fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 md:hidden">
      <ul className="list-none flex justify-around py-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.id} className="mb-0">
              <a
                href="#"
                className={`flex flex-col items-center gap-1 p-2 no-underline text-xs rounded-lg ${
                  currentPage === item.id 
                    ? 'text-primary bg-transparent' 
                    : 'text-card-foreground'
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(item.id as any)
                }}
              >
                <Icon className="w-5 h-5" />
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