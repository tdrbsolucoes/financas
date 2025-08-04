import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { transactionsService, Transaction } from '../src/lib/supabase'
import { TrendingUp, TrendingDown, Clock, AlertTriangle, DollarSign } from 'lucide-react'

interface DashboardProps {
  user: User
  onDatabaseError?: (error: any) => void
}

const Dashboard: React.FC<DashboardProps> = ({ user, onDatabaseError }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTransactions()
  }, [user])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const { data, error } = await transactionsService.getTransactions(user.id)
      
      if (error) throw error
      
      setTransactions(data || [])
    } catch (error: any) {
      if (onDatabaseError) {
        onDatabaseError(error)
        return
      }
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.due_date)
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear
    })

    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const pendingTransactions = currentMonthTransactions
      .filter(t => !t.is_paid)

    const overdueTransactions = pendingTransactions
      .filter(t => new Date(t.due_date) < now)

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      pendingCount: pendingTransactions.length,
      overdueCount: overdueTransactions.length
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Carregando dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-message">
        Erro ao carregar dados: {error}
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div>
      {/* Cards de Estatísticas */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="value income">{formatCurrency(stats.totalIncome)}</div>
          <div className="label">
            <TrendingUp size={16} />
            Receitas do Mês
          </div>
        </div>

        <div className="stat-card">
          <div className="value expense">{formatCurrency(stats.totalExpenses)}</div>
          <div className="label">
            <TrendingDown size={16} />
            Despesas do Mês
          </div>
        </div>

        <div className="stat-card">
          <div className={`value ${stats.balance >= 0 ? 'income' : 'expense'}`}>
            {formatCurrency(stats.balance)}
          </div>
          <div className="label">
            <DollarSign size={16} />
            Saldo do Mês
          </div>
        </div>

        <div className="stat-card">
          <div className="value">{stats.pendingCount}</div>
          <div className="label">
            <Clock size={16} />
            Transações Pendentes
          </div>
          {stats.overdueCount > 0 && (
            <div className="change negative">
              <AlertTriangle size={12} />
              {stats.overdueCount} em atraso
            </div>
          )}
        </div>
      </div>

      {transactions.length === 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="empty-state">
            <p>Nenhuma transação encontrada. Comece adicionando suas primeiras receitas e despesas!</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard