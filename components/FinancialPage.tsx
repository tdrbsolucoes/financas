import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { transactionsService, contactsService, Transaction, Contact } from '../src/lib/supabase'
import { Plus, Edit, Trash2, Settings, Check, X, Filter, Eye, EyeOff } from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table'
import { Button } from '../src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../src/components/ui/table'
import { Badge } from '../src/components/ui/badge'
import { Input } from '../src/components/ui/input'
import TransactionModal from './TransactionModal'
import ConfirmationModal from './ConfirmationModal'
import { cn } from '../src/lib/utils'

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
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState('')
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

  const columnHelper = createColumnHelper<Transaction>()

  const columns = React.useMemo<ColumnDef<Transaction>[]>(
    () => [
      columnHelper.accessor('description', {
        header: 'Descrição',
        cell: ({ getValue }) => (
          <div className="font-medium">
            {getValue()}
          </div>
        ),
      }),
      columnHelper.accessor('amount', {
        header: 'Valor',
        cell: ({ getValue, row }) => (
          <div className={cn(
            "font-semibold",
            row.original.type === 'income' ? 'text-green-600' : 'text-red-600'
          )}>
            {formatCurrency(Number(getValue()))}
          </div>
        ),
      }),
      columnHelper.accessor('date', {
        header: 'Data',
        cell: ({ getValue }) => formatDate(getValue()),
      }),
      columnHelper.accessor('due_date', {
        header: 'Vencimento',
        cell: ({ getValue }) => formatDate(getValue()),
      }),
      columnHelper.accessor('type', {
        header: 'Tipo',
        cell: ({ getValue }) => (
          <Badge variant={getValue() === 'income' ? 'success' : 'destructive'}>
            {getValue() === 'income' ? 'Receita' : 'Despesa'}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.original),
      }),
      columnHelper.accessor('contact', {
        header: 'Contato',
        cell: ({ getValue }) => getValue()?.name || 'Sem contato',
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Ações',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleTogglePaid(row.original)}
              className={cn(
                "h-8 w-8",
                row.original.is_paid ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"
              )}
            >
              {row.original.is_paid ? <X size={16} /> : <Check size={16} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingTransaction(row.original)
                setShowModal(true)
              }}
              className="h-8 w-8"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setTransactionToDelete(row.original)
                setShowDeleteModal(true)
              }}
              className="h-8 w-8 text-red-600 hover:text-red-700"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ),
      }),
    ],
    []
  )

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true
    const typeMatch = transaction.type === filter
    const paidMatch = showPaidTransactions ? true : !transaction.is_paid
    return typeMatch && paidMatch
  })

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
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
      return <Badge variant="success">Pago</Badge>
    }
    
    const dueDate = new Date(transaction.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    
    if (dueDate < today) {
      return <Badge variant="destructive">Vencido</Badge>
    }
    
    return <Badge variant="outline">Em Aberto</Badge>
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Carregando transações...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filtros e Controles */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Configurações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Busca Global */}
            <div className="flex items-center gap-4">
              <Input
                placeholder="Buscar transações..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            {/* Filtros por Tipo */}
            <div className="flex items-center gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setFilter('all')
                  setShowPaidTransactions(false)
                }}
              >
                Todas
              </Button>
              <Button
                variant={filter === 'income' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('income')}
              >
                Receitas
              </Button>
              <Button
                variant={filter === 'expense' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('expense')}
              >
                Despesas
              </Button>
              
              {(filter === 'income' || filter === 'expense') && (
                <Button
                  variant={showPaidTransactions ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowPaidTransactions(!showPaidTransactions)}
                >
                  {showPaidTransactions ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showPaidTransactions ? 'Ocultar Pagas' : 'Ver Pagas'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuração de Colunas */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Colunas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {table.getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={(e) => column.toggleVisibility(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label className="text-sm font-medium">
                    {typeof column.columnDef.header === 'string' 
                      ? column.columnDef.header 
                      : column.id}
                  </label>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Financeiras</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>
                {filter === 'all' 
                  ? 'Nenhuma transação encontrada. Clique no botão + para adicionar a primeira!'
                  : `Nenhuma ${filter === 'income' ? 'receita' : 'despesa'} encontrada.`
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className={cn(
                          row.original.is_paid && "opacity-60"
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        Nenhum resultado encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão Flutuante */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => {
          setEditingTransaction(null)
          setShowModal(true)
        }}
      >
        <Plus size={24} />
      </Button>

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