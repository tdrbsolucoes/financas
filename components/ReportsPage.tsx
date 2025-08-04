import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { transactionsService, Transaction } from '../src/lib/supabase'
import { Calendar, TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react'

interface ReportsPageProps {
  user: User
}

const ReportsPage: React.FC<ReportsPageProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('current-month')

  useEffect(() => {
    loadTransactions()
  }, [user, selectedPeriod])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      
      let startDate: string, endDate: string
      const now = new Date()
      
      switch (selectedPeriod) {
        case 'current-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
          break
        case 'last-month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
          endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
          break
        case 'current-year':
          startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
          endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
          break
        default:
          const { data, error } = await transactionsService.getTransactions(user.id)
          if (error) throw error
          setTransactions(data || [])
          setLoading(false)
          return
      }
      
      const { data, error } = await transactionsService.getTransactionsByPeriod(user.id, startDate, endDate)
      if (error) throw error
      
      setTransactions(data || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateReports = () => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const paidIncome = transactions
      .filter(t => t.type === 'income' && t.is_paid)
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const paidExpenses = transactions
      .filter(t => t.type === 'expense' && t.is_paid)
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const pendingIncome = transactions
      .filter(t => t.type === 'income' && !t.is_paid)

    const pendingExpenses = transactions
      .filter(t => t.type === 'expense' && !t.is_paid)

    const now = new Date()
    const overdueTransactions = transactions
      .filter(t => !t.is_paid && new Date(t.due_date) < now)

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      paidIncome,
      paidExpenses,
      paidBalance: paidIncome - paidExpenses,
      pendingIncome,
      pendingExpenses,
      overdueTransactions
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'current-month': return 'Mês Atual'
      case 'last-month': return 'Mês Passado'
      case 'current-year': return 'Ano Atual'
      case 'all': return 'Todos os Períodos'
      default: return 'Período Selecionado'
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Carregando relatórios...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-message">
        Erro ao carregar relatórios: {error}
      </div>
    )
  }

  const reports = calculateReports()

  return (
    <div>
      <div className="page-header">
        <div className="filter-buttons">
          <button
            className={selectedPeriod === 'current-month' ? 'active' : ''}
            onClick={() => setSelectedPeriod('current-month')}
          >
            Mês Atual
          </button>
          <button
            className={selectedPeriod === 'last-month' ? 'active' : ''}
            onClick={() => setSelectedPeriod('last-month')}
          >
            Mês Passado
          </button>
          <button
            className={selectedPeriod === 'current-year' ? 'active' : ''}
            onClick={() => setSelectedPeriod('current-year')}
          >
            Ano Atual
          </button>
          <button
            className={selectedPeriod === 'all' ? 'active' : ''}
            onClick={() => setSelectedPeriod('all')}
          >
            Todos
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="value income">{formatCurrency(reports.totalIncome)}</div>
          <div className="label">
            <TrendingUp size={16} />
            Total de Receitas - {getPeriodLabel()}
          </div>
          <div className="change positive">
            Recebido: {formatCurrency(reports.paidIncome)}
          </div>
        </div>

        <div className="stat-card">
          <div className="value expense">{formatCurrency(reports.totalExpenses)}</div>
          <div className="label">
            <TrendingDown size={16} />
            Total de Despesas - {getPeriodLabel()}
          </div>
          <div className="change negative">
            Pago: {formatCurrency(reports.paidExpenses)}
          </div>
        </div>

        <div className="stat-card">
          <div className={`value ${reports.balance >= 0 ? 'income' : 'expense'}`}>
            {formatCurrency(reports.balance)}
          </div>
          <div className="label">
            <Calendar size={16} />
            Saldo Previsto - {getPeriodLabel()}
          </div>
          <div className={`change ${reports.paidBalance >= 0 ? 'positive' : 'negative'}`}>
            Saldo Real: {formatCurrency(reports.paidBalance)}
          </div>
        </div>

        <div className="stat-card">
          <div className="value">{reports.overdueTransactions.length}</div>
          <div className="label">
            <AlertTriangle size={16} />
            Transações Vencidas
          </div>
          {reports.overdueTransactions.length > 0 && (
            <div className="change negative">
              Valor: {formatCurrency(
                reports.overdueTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="card">
          <h3>Contas a Receber</h3>
          {reports.pendingIncome.length === 0 ? (
            <p className="empty-state">Nenhuma conta a receber pendente.</p>
          ) : (
            <div className="data-list">
              {reports.pendingIncome.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="data-item">
                  <div className="item-content">
                    <h4>{transaction.description}</h4>
                    <p>
                      Vencimento: {formatDate(transaction.due_date)} • 
                      {transaction.contact?.name || 'Sem contato'}
                    </p>
                  </div>
                  <div className="amount income">
                    {formatCurrency(Number(transaction.amount))}
                  </div>
                </div>
              ))}
              {reports.pendingIncome.length > 5 && (
                <p className="text-center text-muted-foreground mt-4">
                  E mais {reports.pendingIncome.length - 5} contas...
                </p>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Contas a Pagar</h3>
          {reports.pendingExpenses.length === 0 ? (
            <p className="empty-state">Nenhuma conta a pagar pendente.</p>
          ) : (
            <div className="data-list">
              {reports.pendingExpenses.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="data-item">
                  <div className="item-content">
                    <h4>{transaction.description}</h4>
                    <p>
                      Vencimento: {formatDate(transaction.due_date)} • 
                      {transaction.contact?.name || 'Sem contato'}
                    </p>
                  </div>
                  <div className="amount expense">
                    {formatCurrency(Number(transaction.amount))}
                  </div>
                </div>
              ))}
              {reports.pendingExpenses.length > 5 && (
                <p className="text-center text-muted-foreground mt-4">
                  E mais {reports.pendingExpenses.length - 5} contas...
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {reports.overdueTransactions.length > 0 && (
        <div className="card mt-6">
          <h3 className="text-destructive flex items-center gap-2">
            <AlertTriangle size={20} />
            Transações Vencidas
          </h3>
          <div className="data-list">
            {reports.overdueTransactions.map((transaction) => (
              <div key={transaction.id} className="data-item">
                <div className="item-content">
                  <h4>{transaction.description}</h4>
                  <p>
                    Venceu em: {formatDate(transaction.due_date)} • 
                    {transaction.type === 'income' ? 'Receita' : 'Despesa'} • 
                    {transaction.contact?.name || 'Sem contato'}
                  </p>
                </div>
                <div className={`amount ${transaction.type}`}>
                  {formatCurrency(Number(transaction.amount))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportsPage