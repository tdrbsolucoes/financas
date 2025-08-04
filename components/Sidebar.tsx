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
    <div className="w-70 bg-card text-card-foreground p-6 flex flex-col justify-between border-r border-border transition-all duration-300 flex-shrink-0">
      <div>
        <div className="flex items-center gap-3 mb-10">
          <div className="text-2xl bg-primary text-primary-foreground rounded-lg w-10 h-10 grid place-items-center font-bold flex-shrink-0">F</div>
          <h1 className="text-xl font-semibold whitespace-nowrap">Finanças</h1>
        </div>
        
        <nav className="flex-grow">
          <ul className="list-none">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id} className="mb-2">
                  <a
                    href="#"
                    className={`flex items-center gap-3 p-3 rounded-lg no-underline font-medium transition-all duration-200 whitespace-nowrap ${
                      currentPage === item.id 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'text-card-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    onClick={(e) => {
                      e.preventDefault()
                      onPageChange(item.id as any)
                    }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
      
      <button className="flex items-center gap-3 p-3 rounded-lg bg-transparent border-none text-muted-foreground font-medium cursor-pointer w-full text-left hover:bg-accent hover:text-destructive" onClick={onLogout}>
        <LogOut className="w-5 h-5" />
        Sair
      </button>
    </div>
  )
}

export default Sidebar