import React, { useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'

export function Reports() {
  const { transactions } = useTransactions()
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [year, month] = selectedMonth.split('-').map(Number)
  
  const monthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.data_vencimento)
    return transactionDate.getFullYear() === year && transactionDate.getMonth() === month - 1
  })

  const totalIncome = monthTransactions
    .filter(t => t.tipo === 'income')
    .reduce((sum, t) => sum + Number(t.valor), 0)

  const totalExpenses = monthTransactions
    .filter(t => t.tipo === 'expense')
    .reduce((sum, t) => sum + Number(t.valor), 0)

  const balance = totalIncome - totalExpenses

  const paidIncome = monthTransactions
    .filter(t => t.tipo === 'income' && t.pago)
    .reduce((sum, t) => sum + Number(t.valor), 0)

  const paidExpenses = monthTransactions
    .filter(t => t.tipo === 'expense' && t.pago)
    .reduce((sum, t) => sum + Number(t.valor), 0)

  const pendingIncome = monthTransactions
    .filter(t => t.tipo === 'income' && !t.pago)
    .reduce((sum, t) => sum + Number(t.valor), 0)

  const pendingExpenses = monthTransactions
    .filter(t => t.tipo === 'expense' && !t.pago)
    .reduce((sum, t) => sum + Number(t.valor), 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatMonthYear = (dateString: string) => {
    const [year, month] = dateString.split('-')
    const date = new Date(Number(year), Number(month) - 1)
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  return (
    <div>
      <div className="header">
        <h2>Relatórios</h2>
      </div>
      
      <div className="page-content">
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="form-group">
            <label>Selecionar Mês</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>

        <h3>Resumo de {formatMonthYear(selectedMonth)}</h3>
        
        <div className="dashboard-grid">
          <div className="card stat-card">
            <div className="value income">{formatCurrency(totalIncome)}</div>
            <div className="label">Total de Receitas</div>
          </div>
          
          <div className="card stat-card">
            <div className="value expense">{formatCurrency(totalExpenses)}</div>
            <div className="label">Total de Despesas</div>
          </div>
          
          <div className="card stat-card">
            <div className={`value ${balance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(balance)}
            </div>
            <div className="label">Saldo do Mês</div>
          </div>
          
          <div className="card stat-card">
            <div className="value income">{formatCurrency(paidIncome)}</div>
            <div className="label">Receitas Recebidas</div>
          </div>
          
          <div className="card stat-card">
            <div className="value expense">{formatCurrency(paidExpenses)}</div>
            <div className="label">Despesas Pagas</div>
          </div>
          
          <div className="card stat-card">
            <div className={`value ${(paidIncome - paidExpenses) >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(paidIncome - paidExpenses)}
            </div>
            <div className="label">Saldo Realizado</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
          <div className="card">
            <h3>Contas a Receber</h3>
            {monthTransactions.filter(t => t.tipo === 'income' && !t.pago).length === 0 ? (
              <p className="empty-state">Nenhuma conta a receber</p>
            ) : (
              <div className="data-list">
                {monthTransactions
                  .filter(t => t.tipo === 'income' && !t.pago)
                  .map((transaction) => (
                    <div key={transaction.id} className="data-item">
                      <div className="item-content">
                        <h4>{transaction.descricao}</h4>
                        <p>Vencimento: {new Date(transaction.data_vencimento).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="amount income">
                        {formatCurrency(Number(transaction.valor))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <strong>Total: {formatCurrency(pendingIncome)}</strong>
            </div>
          </div>

          <div className="card">
            <h3>Contas a Pagar</h3>
            {monthTransactions.filter(t => t.tipo === 'expense' && !t.pago).length === 0 ? (
              <p className="empty-state">Nenhuma conta a pagar</p>
            ) : (
              <div className="data-list">
                {monthTransactions
                  .filter(t => t.tipo === 'expense' && !t.pago)
                  .map((transaction) => (
                    <div key={transaction.id} className="data-item">
                      <div className="item-content">
                        <h4>{transaction.descricao}</h4>
                        <p>Vencimento: {new Date(transaction.data_vencimento).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="amount expense">
                        {formatCurrency(Number(transaction.valor))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <strong>Total: {formatCurrency(pendingExpenses)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}