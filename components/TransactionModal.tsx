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
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{transaction ? 'Editar Transação' : 'Nova Transação'}</h3>
          <button className="close-button" onClick={onClose}>
            <X />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="description">Descrição *</label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Valor (R$) *</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Tipo *</label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
              required
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date">Data *</label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="due_date">Data de Vencimento *</label>
            <input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact_id">Contato</label>
            <select
              id="contact_id"
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

          <div className="form-group-checkbox">
            <input
              id="is_paid"
              type="checkbox"
              checked={formData.is_paid}
              onChange={(e) => setFormData(prev => ({ ...prev, is_paid: e.target.checked }))}
            />
            <label htmlFor="is_paid">Já foi pago</label>
          </div>

          {formData.is_paid && (
            <div className="form-group">
              <label htmlFor="paid_date">Data do Pagamento</label>
              <input
                id="paid_date"
                type="date"
                value={formData.paid_date}
                onChange={(e) => setFormData(prev => ({ ...prev, paid_date: e.target.value }))}
              />
            </div>
          )}

          <div className="form-group-checkbox">
            <input
              id="is_recurring"
              type="checkbox"
              checked={formData.is_recurring}
              onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
            />
            <label htmlFor="is_recurring">Transação recorrente</label>
          </div>

          <button type="submit" className="form-button">
            {transaction ? 'Atualizar' : 'Criar'} Transação
          </button>
        </form>
      </div>
    </div>
  )
}

export default TransactionModal