import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { transactionsService, contactsService, Transaction, Contact } from '../src/lib/supabase'
import { Plus, Edit, Trash2, Settings, Check, X } from 'lucide-react'
import TransactionModal from './TransactionModal'
import ConfirmationModal from './ConfirmationModal'

interface FinancialPageProps {
  user: User
}

const FinancialPage: React.FC<FinancialPageProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showPaidTransactions, setShowPaidTransactions] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    description: true,
    amount: true,
    date: true,
    dueDate: true,
    type: true,
    status: true,
    contact: true,
    actions: true
  })

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Primeiro carregar contatos
      const contactsResult = await contactsService.getContacts(user.id)
      if (contactsResult.error) throw contactsResult.error
      setContacts(contactsResult.data || [])
      
      // Depois gerar transações recorrentes se necessário
      await generateRecurringTransactions(contactsResult.data || [])
      
      // Por último carregar todas as transações (incluindo as recém-criadas)
      const transactionsResult = await transactionsService.getTransactions(user.id)
      if (transactionsResult.error) throw transactionsResult.error
      setTransactions(transactionsResult.data || [])
      
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Função separada para recarregar apenas transações (sem gerar recorrentes)
  const reloadTransactions = async () => {
    try {
      const transactionsResult = await transactionsService.getTransactions(user.id)
      if (transactionsResult.error) throw transactionsResult.error
      setTransactions(transactionsResult.data || [])
    } catch (error: any) {
      setError(error.message)
    }
  }

  const generateRecurringTransactions = async (contacts: Contact[]) => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Buscar todas as transações existentes uma vez
    const { data: existingTransactions } = await transactionsService.getTransactions(user.id)
    
    for (const contact of contacts) {
      if (contact.recurring_charge?.isActive) {
        const launchDay = contact.recurring_charge.launchDay
        const dueDay = contact.recurring_charge.dueDay
        const amount = contact.recurring_charge.amount
        
        // Verificar se já existe transação para este mês
        const existingTransaction = existingTransactions?.find(t => 
          t.contact_id === contact.id &&
          t.is_recurring &&
          new Date(t.date).getMonth() === currentMonth &&
          new Date(t.date).getFullYear() === currentYear
        )
        
        // Só criar se não existir e se já passou do dia de lançamento
        if (!existingTransaction && now.getDate() >= launchDay) {
          // Criar transação recorrente
          const launchDate = new Date(currentYear, currentMonth, launchDay)
          const dueDate = new Date(currentYear, currentMonth, dueDay)
          
          try {
            const { data, error } = await transactionsService.createTransaction({
              user_id: user.id,
              description: `Cobrança mensal - ${contact.name}`,
              amount: amount,
              date: launchDate.toISOString().split('T')[0],
              due_date: dueDate.toISOString().split('T')[0],
              type: 'income',
              is_paid: false,
              is_recurring: true,
              contact_id: contact.id
            })
            
            if (!error && data) {
              setTransactions(prev => [data, ...prev])
              console.log(`Transação recorrente criada para ${contact.name}: ${formatCurrency(amount)}`)
            }
          } catch (error) {
            console.error('Erro ao gerar transação recorrente:', error)
          }
        }
      }
    }
  }

  const handleSaveTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at'>) => {
    try {
      if (editingTransaction) {
        const { data, error } = await transactionsService.updateTransaction(editingTransaction.id, transactionData)
        if (error) throw error
        
        // Recarregar transações para manter sincronia
        await reloadTransactions()
      } else {
        const { data, error } = await transactionsService.createTransaction({
          ...transactionData,
          user_id: user.id
        })
        if (error) throw error
        
        // Recarregar transações para manter sincronia
        await reloadTransactions()
      }
      
      setShowModal(false)
      setEditingTransaction(null)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return

    try {
      const { error } = await transactionsService.deleteTransaction(transactionToDelete.id)
      if (error) throw error
      
      // Recarregar transações para manter sincronia
      await reloadTransactions()
      setShowDeleteModal(false)
      setTransactionToDelete(null)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleTogglePaid = async (transaction: Transaction) => {
    try {
      if (transaction.is_paid) {
        // Marcar como não pago
        const { data, error } = await transactionsService.updateTransaction(transaction.id, {
          is_paid: false,
          paid_date: undefined
        })
        if (error) throw error
      } else {
        // Marcar como pago
        const { data, error } = await transactionsService.markAsPaid(transaction.id, new Date().toISOString().split('T')[0])
        if (error) throw error
      }
      
      // Recarregar transações para manter sincronia
      await reloadTransactions()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true
    const typeMatch = transaction.type === filter
    const paidMatch = showPaidTransactions ? true : !transaction.is_paid
    return typeMatch && paidMatch
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (transaction: Transaction) => {
    if (transaction.is_paid) {
      return <span className="status-badge status-paid">Pago</span>
    }
    
    const dueDate = new Date(transaction.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    
    if (dueDate < today) {
      return <span className="status-badge status-overdue">Vencido</span>
    }
    
    return <span className="status-badge status-open">Em Aberto</span>
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Carregando transações...</p>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="page-header">
        <div className="filter-container">
          <div className="filter-dropdown-container">
            <button
              className="filter-dropdown-button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              Filtrar
            </button>
            
            {showFilterDropdown && (
              <div className="filter-dropdown">
                <button
                  className={filter === 'all' ? 'active' : ''}
                  onClick={() => {
                    setFilter('all')
                    setShowFilterDropdown(false)
                    setShowPaidTransactions(false)
                  }}
                >
                  Todas
                </button>
                <button
                  className={filter === 'income' ? 'active' : ''}
                  onClick={() => {
                    setFilter('income')
                    setShowFilterDropdown(false)
                  }}
                >
                  Receitas
                </button>
                <button
                  className={filter === 'expense' ? 'active' : ''}
                  onClick={() => {
                    setFilter('expense')
                    setShowFilterDropdown(false)
                  }}
                >
                  Despesas
                </button>
              </div>
            )}
          </div>
          
          {(filter === 'income' || filter === 'expense') && (
            <button
              className={`paid-toggle-button ${showPaidTransactions ? 'active' : ''}`}
              onClick={() => setShowPaidTransactions(!showPaidTransactions)}
            >
              {showPaidTransactions ? 'Ocultar Pagas' : 'Visualizar Contas Pagas'}
            </button>
          )}
        </div>

        <div className="column-selector-container">
          <button
            className="column-selector-button"
            onClick={() => setShowColumnSelector(!showColumnSelector)}
          >
            <Settings size={16} />
          </button>

          {showColumnSelector && (
            <div className="column-selector-dropdown">
              {Object.entries(visibleColumns).map(([key, visible]) => (
                <div
                  key={key}
                  className="column-selector-item"
                  onClick={() => setVisibleColumns(prev => ({ ...prev, [key]: !visible }))}
                >
                  <input type="checkbox" checked={visible} readOnly />
                  {key === 'description' && 'Descrição'}
                  {key === 'amount' && 'Valor'}
                  {key === 'date' && 'Data'}
                  {key === 'dueDate' && 'Vencimento'}
                  {key === 'type' && 'Tipo'}
                  {key === 'status' && 'Status'}
                  {key === 'contact' && 'Contato'}
                  {key === 'actions' && 'Ações'}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="table-container">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>
              {filter === 'all' 
                ? 'Nenhuma transação encontrada. Clique no botão + para adicionar a primeira!'
                : `Nenhuma ${filter === 'income' ? 'receita' : 'despesa'} encontrada.`
              }
            </p>
          </div>
        ) : (
          <div className="transactions-grid">
            {filteredTransactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className={`transaction-card ${transaction.is_paid ? 'paid' : ''}`}
              >
                <div className="transaction-header">
                  <div className="transaction-info">
                    <h4 className="transaction-description">{transaction.description}</h4>
                    <div className="transaction-meta">
                      <span className="transaction-contact">
                        {transaction.contact?.name || 'Sem contato'}
                      </span>
                      <span className="transaction-type">
                        {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </div>
                  </div>
                  <div className="transaction-amount">
                    <span className={`amount ${transaction.type}`}>
                      {formatCurrency(Number(transaction.amount))}
                    </span>
                  </div>
                </div>
                
                <div className="transaction-footer">
                  <div className="transaction-dates">
                    <span>Data: {formatDate(transaction.date)}</span>
                    <span>Venc: {formatDate(transaction.due_date)}</span>
                    {getStatusBadge(transaction)}
                  </div>
                  
                  <div className="transaction-actions">
                    <button
                      className="action-button pay-button"
                      onClick={() => handleTogglePaid(transaction)}
                      title={transaction.is_paid ? 'Marcar como não pago' : 'Marcar como pago'}
                    >
                      {transaction.is_paid ? <X size={16} /> : <Check size={16} />}
                    </button>
                    <button
                      className="action-button"
                      onClick={() => {
                        setEditingTransaction(transaction)
                        setShowModal(true)
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="action-button"
                      onClick={() => {
                        setTransactionToDelete(transaction)
                        setShowDeleteModal(true)
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="fab"
        onClick={() => {
          setEditingTransaction(null)
          setShowModal(true)
        }}
      >
        <Plus />
      </button>

      {showModal && (
        <TransactionModal
          transaction={editingTransaction}
          contacts={contacts}
          onSave={handleSaveTransaction}
          onClose={() => {
            setShowModal(false)
            setEditingTransaction(null)
          }}
        />
      )}

      {showDeleteModal && transactionToDelete && (
        <ConfirmationModal
          title="Excluir Transação"
          message={`Tem certeza que deseja excluir "${transactionToDelete.description}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDeleteTransaction}
          onCancel={() => {
            setShowDeleteModal(false)
            setTransactionToDelete(null)
          }}
        />
      )}
    </div>
  )
}

export default FinancialPage