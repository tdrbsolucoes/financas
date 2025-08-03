import React from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useContacts } from '../hooks/useContacts'

export function Dashboard() {
  const { transactions } = useTransactions()
  const { contacts } = useContacts()

  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Calcular estatísticas
  const thisMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.data_vencimento)
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
  })

  const totalIncome = thisMonthTransactions
    .filter(t => t.tipo === 'income')
    .reduce((sum, t) => sum + Number(t.valor), 0)

  const totalExpenses = thisMonthTransactions
    .filter(t => t.tipo === 'expense')
    .reduce((sum, t) => sum + Number(t.valor), 0)

  const balance = totalIncome - totalExpenses

  const pendingTransactions = transactions.filter(t => !t.pago && new Date(t.data_vencimento) >= today)
  const overdueTransactions = transactions.filter(t => !t.pago && new Date(t.data_vencimento) < today)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div>
      <div className="header">
        <h2>Dashboard</h2>
      </div>
      
      <div className="page-content">
        <div className="dashboard-grid">
          <div className="card stat-card">
            <div className="value income">{formatCurrency(totalIncome)}</div>
            <div className="label">Receitas do Mês</div>
          </div>
          
          <div className="card stat-card">
            <div className="value expense">{formatCurrency(totalExpenses)}</div>
            <div className="label">Despesas do Mês</div>
          </div>
          
          <div className="card stat-card">
            <div className={`value ${balance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(balance)}
            </div>
            <div className="label">Saldo do Mês</div>
          </div>
          
          <div className="card stat-card">
            <div className="value">{contacts.length}</div>
            <div className="label">Total de Contatos</div>
          </div>
          
          <div className="card stat-card">
            <div className="value">{pendingTransactions.length}</div>
            <div className="label">Transações Pendentes</div>
          </div>
          
          <div className="card stat-card">
            <div className="value negative">{overdueTransactions.length}</div>
            <div className="label">Transações Vencidas</div>
          </div>
        </div>

        {overdueTransactions.length > 0 && (
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3>⚠️ Transações Vencidas</h3>
            <div className="data-list">
              {overdueTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="data-item">
                  <div className="item-content">
                    <h4>{transaction.descricao}</h4>
                    <p>Vencimento: {new Date(transaction.data_vencimento).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className={`amount ${transaction.tipo}`}>
                    {formatCurrency(Number(transaction.valor))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}