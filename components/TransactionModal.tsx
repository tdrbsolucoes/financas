import React, { useState, useEffect } from 'react'
import { Transaction, Contact } from '../src/lib/supabase'
import { X } from 'lucide-react'

interface TransactionModalProps {
  transaction: Transaction | null
  contacts: Contact[]
  onSave: (transaction: Omit<Transaction, 'id' | 'created_at'>) => void
  onClose: () => void
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  transaction, 
  contacts, 
  onSave, 
  onClose 
}) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense',
    is_paid: false,
    paid_date: '',
    is_recurring: false,
    contact_id: ''
  })

  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description,
        amount: transaction.amount.toString(),
        date: transaction.date,
        due_date: transaction.due_date,
        type: transaction.type,
        is_paid: transaction.is_paid,
        paid_date: transaction.paid_date || '',
        is_recurring: transaction.is_recurring,
        contact_id: transaction.contact_id || ''
      })
    }
  }, [transaction])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const transactionData: Omit<Transaction, 'id' | 'created_at'> = {
      user_id: '', // Será preenchido pelo componente pai
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date,
      due_date: formData.due_date,
      type: formData.type,
      is_paid: formData.is_paid,
      paid_date: formData.paid_date || undefined,
      is_recurring: formData.is_recurring,
      contact_id: formData.contact_id === '' ? null : formData.contact_id
    }

    onSave(transactionData)
  }

  return (
    <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 backdrop-blur-sm">
      <div className="bg-card p-6 rounded-lg w-[90%] max-w-lg shadow-2xl border border-border">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
          <h3 className="m-0 text-xl font-semibold">{transaction ? 'Editar Transação' : 'Nova Transação'}</h3>
          <button className="bg-transparent border-none text-xl cursor-pointer text-muted-foreground" onClick={onClose}>
            <X />
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="font-medium text-sm text-muted-foreground">Descrição *</label>
            <input
              id="description"
              type="text"
              className="w-full p-3 border border-border bg-input text-foreground rounded-lg text-base"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="amount" className="font-medium text-sm text-muted-foreground">Valor (R$) *</label>
            <input
              id="amount"
              type="number"
              className="w-full p-3 border border-border bg-input text-foreground rounded-lg text-base"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="type" className="font-medium text-sm text-muted-foreground">Tipo *</label>
            <select
              id="type"
              className="w-full p-3 border border-border bg-input text-foreground rounded-lg text-base"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
              required
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="date" className="font-medium text-sm text-muted-foreground">Data *</label>
            <input
              id="date"
              type="date"
              className="w-full p-3 border border-border bg-input text-foreground rounded-lg text-base"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="due_date" className="font-medium text-sm text-muted-foreground">Data de Vencimento *</label>
            <input
              id="due_date"
              type="date"
              className="w-full p-3 border border-border bg-input text-foreground rounded-lg text-base"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="contact_id" className="font-medium text-sm text-muted-foreground">Contato</label>
            <select
              id="contact_id"
              className="w-full p-3 border border-border bg-input text-foreground rounded-lg text-base"
              value={formData.contact_id}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_id: e.target.value }))}
            >
              <option value="">Selecione um contato (opcional)</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} ({contact.type})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_paid"
              type="checkbox"
              className="w-4 h-4 accent-primary cursor-pointer"
              checked={formData.is_paid}
              onChange={(e) => setFormData(prev => ({ ...prev, is_paid: e.target.checked }))}
            />
            <label htmlFor="is_paid" className="font-medium text-sm text-muted-foreground cursor-pointer">Já foi pago</label>
          </div>

          {formData.is_paid && (
            <div className="flex flex-col gap-2">
              <label htmlFor="paid_date" className="font-medium text-sm text-muted-foreground">Data do Pagamento</label>
              <input
                id="paid_date"
                type="date"
                className="w-full p-3 border border-border bg-input text-foreground rounded-lg text-base"
                value={formData.paid_date}
                onChange={(e) => setFormData(prev => ({ ...prev, paid_date: e.target.value }))}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              id="is_recurring"
              type="checkbox"
              className="w-4 h-4 accent-primary cursor-pointer"
              checked={formData.is_recurring}
              onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
            />
            <label htmlFor="is_recurring" className="font-medium text-sm text-muted-foreground cursor-pointer">Transação recorrente</label>
          </div>

          <button type="submit" className="p-3 border-none rounded-lg bg-primary text-primary-foreground text-base font-semibold cursor-pointer transition-all hover:brightness-110 mt-4">
            {transaction ? 'Atualizar' : 'Criar'} Transação
          </button>
        </form>
      </div>
    </div>
  )
}

export default TransactionModal