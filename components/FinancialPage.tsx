import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { transactionsService, contactsService, Transaction, Contact } from '../src/lib/supabase'
import { Plus, Edit, Trash2, Check, X, Eye, EyeOff } from 'lucide-react'
import TransactionModal from './TransactionModal'
import ConfirmationModal from './ConfirmationModal'

interface FinancialPageProps {
  user: User
  onDatabaseError?: (error: any) => void
}

const FinancialPage: React.FC<FinancialPageProps> = ({ user, onDatabaseError }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
  const [showPaidTransactions, setShowPaidTransactions] = useState(false)

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
      if (onDatabaseError) {
        onDatabaseError(error)
        return
      }
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
      if (onDatabaseError) {
        onDatabaseError(error)
        return
      }
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
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Pago</span>
    }
    
    const dueDate = new Date(transaction.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    
    if (dueDate < today) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Vencido</span>
    }
    
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Em Aberto</span>
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

      {/* Filtros */}
      <div className="page-header">
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => {
              setFilter('all')
              setShowPaidTransactions(false)
            }}
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
          
          {(filter === 'income' || filter === 'expense') && (
            <button
              className={showPaidTransactions ? 'active' : ''}
              onClick={() => setShowPaidTransactions(!showPaidTransactions)}
            >
              {showPaidTransactions ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPaidTransactions ? 'Ocultar Pagas' : 'Ver Pagas'}
            </button>
          )}
        </div>
      </div>

      {/* Lista de Transações */}
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
        <div className="data-list">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className={`data-item ${transaction.is_paid ? 'opacity-60' : ''}`}>
              <div className="item-content">
                <h4>{transaction.description}</h4>
                <p>
                  {formatDate(transaction.due_date)} • 
                  {transaction.contact?.name || 'Sem contato'} • 
                  {getStatusBadge(transaction)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`amount ${transaction.type}`}>
                  {formatCurrency(Number(transaction.amount))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePaid(transaction)}
                    className={`p-2 rounded-lg border-none cursor-pointer transition-all ${
                      transaction.is_paid 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {transaction.is_paid ? <X size={16} /> : <Check size={16} />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingTransaction(transaction)
                      setShowModal(true)
                    }}
                    className="p-2 rounded-lg border-none bg-blue-100 text-blue-600 cursor-pointer transition-all hover:bg-blue-200"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setTransactionToDelete(transaction)
                      setShowDeleteModal(true)
                    }}
                    className="p-2 rounded-lg border-none bg-red-100 text-red-600 cursor-pointer transition-all hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botão Flutuante */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white border-none rounded-full shadow-lg cursor-pointer transition-all hover:bg-blue-700 flex items-center justify-center"
        onClick={() => {
          setEditingTransaction(null)
          setShowModal(true)
        }}
      >
        <Plus size={24} />
      </button>

      {/* Modais */}
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