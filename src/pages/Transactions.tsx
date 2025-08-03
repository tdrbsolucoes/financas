import React, { useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { TransactionModal } from '../components/TransactionModal'
import { Database } from '../types/database'

type Transaction = Database['public']['Tables']['transacoes']['Row'] & {
  contatos?: { nome: string } | null
}

export function Transactions() {
  const { transactions, loading, createTransaction, updateTransaction, deleteTransaction, markAsPaid } = useTransactions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'pending' | 'paid'>('all')

  const filteredTransactions = transactions.filter(transaction => {
    switch (filter) {
      case 'income':
        return transaction.tipo === 'income'
      case 'expense':
        return transaction.tipo === 'expense'
      case 'pending':
        return !transaction.pago
      case 'paid':
        return transaction.pago
      default:
        return true
    }
  })

  const handleSaveTransaction = async (transactionData: any) => {
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, transactionData)
      } else {
        await createTransaction(transactionData)
      }
      setIsModalOpen(false)
      setEditingTransaction(null)
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsModalOpen(true)
  }

  const handleDeleteTransaction = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      await deleteTransaction(id)
    }
  }

  const handleTogglePaid = async (id: number, currentStatus: boolean) => {
    await markAsPaid(id, !currentStatus)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusBadge = (transaction: Transaction) => {
    if (transaction.pago) {
      return <span className="status-badge status-paid">Pago</span>
    }
    
    const today = new Date()
    const dueDate = new Date(transaction.data_vencimento)
    
    if (dueDate < today) {
      return <span className="status-badge status-overdue">Vencido</span>
    }
    
    return <span className="status-badge status-open">Pendente</span>
  }

  if (loading) {
    return (
      <div>
        <div className="header">
          <h2>Transações</h2>
        </div>
        <div className="page-content">
          <p>Carregando transações...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="header">
        <h2>Transações</h2>
      </div>
      
      <div className="page-content">
        <div className="page-header">
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              Todas
            </button>
            <button 
              className={filter === 'income' ? 'active' : ''}
              onClick={() => setFilter('income')}
            >
              Receitas
            </button>
            <button 
              className={filter === 'expense' ? 'active' : ''}
              onClick={() => setFilter('expense')}
            >
              Despesas
            </button>
            <button 
              className={filter === 'pending' ? 'active' : ''}
              onClick={() => setFilter('pending')}
            >
              Pendentes
            </button>
            <button 
              className={filter === 'paid' ? 'active' : ''}
              onClick={() => setFilter('paid')}
            >
              Pagas
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="empty-state">
            {filter === 'all' ? 'Nenhuma transação encontrada.' : `Nenhuma transação ${filter === 'income' ? 'de receita' : filter === 'expense' ? 'de despesa' : filter} encontrada.`}
          </p>
        ) : (
          <div className="table-container">
            <table className="financial-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Descrição</th>
                  <th>Contato</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Tipo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr 
                    key={transaction.id} 
                    className={`transaction-row ${transaction.pago ? 'paid' : ''}`}
                  >
                    <td>
                      <input
                        type="checkbox"
                        className="status-checkbox"
                        checked={transaction.pago}
                        onChange={() => handleTogglePaid(transaction.id, transaction.pago)}
                      />
                    </td>
                    <td>{transaction.descricao}</td>
                    <td>{transaction.contatos?.nome || '-'}</td>
                    <td className={`amount ${transaction.tipo}`}>
                      {formatCurrency(Number(transaction.valor))}
                    </td>
                    <td>{new Date(transaction.data_vencimento).toLocaleDateString('pt-BR')}</td>
                    <td>{getStatusBadge(transaction)}</td>
                    <td>
                      <div className="item-actions">
                        <button
                          className="action-button"
                          onClick={() => handleEditTransaction(transaction)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="action-button"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button 
          className="fab"
          onClick={() => {
            setEditingTransaction(null)
            setIsModalOpen(true)
          }}
        >
          +
        </button>

        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingTransaction(null)
          }}
          onSave={handleSaveTransaction}
          transaction={editingTransaction}
        />
      </div>
    </div>
  )
}