import React, { useState, useEffect } from 'react'
import { Database } from '../types/database'
import { useContacts } from '../hooks/useContacts'

type Transaction = Database['public']['Tables']['transacoes']['Row']

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (transaction: any) => void
  transaction?: Transaction | null
}

export function TransactionModal({ isOpen, onClose, onSave, transaction }: TransactionModalProps) {
  const { contacts } = useContacts()
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data_lancamento: '',
    data_vencimento: '',
    tipo: 'expense' as 'income' | 'expense',
    contato_id: '',
    recorrente: false
  })

  useEffect(() => {
    if (transaction) {
      setFormData({
        descricao: transaction.descricao || '',
        valor: transaction.valor.toString(),
        data_lancamento: transaction.data_lancamento,
        data_vencimento: transaction.data_vencimento,
        tipo: transaction.tipo,
        contato_id: transaction.contato_id || '',
        recorrente: transaction.recorrente || false
      })
    } else {
      const today = new Date().toISOString().split('T')[0]
      setFormData({
        descricao: '',
        valor: '',
        data_lancamento: today,
        data_vencimento: today,
        tipo: 'expense',
        contato_id: '',
        recorrente: false
      })
    }
  }, [transaction])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const transactionData = {
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      data_lancamento: formData.data_lancamento,
      data_vencimento: formData.data_vencimento,
      tipo: formData.tipo,
      contato_id: formData.contato_id || null,
      recorrente: formData.recorrente
    }

    onSave(transactionData)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{transaction ? 'Editar Transação' : 'Nova Transação'}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Descrição</label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'income' | 'expense' })}
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </div>

          <div className="form-group">
            <label>Data de Lançamento</label>
            <input
              type="date"
              value={formData.data_lancamento}
              onChange={(e) => setFormData({ ...formData, data_lancamento: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Data de Vencimento</label>
            <input
              type="date"
              value={formData.data_vencimento}
              onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Contato</label>
            <select
              value={formData.contato_id}
              onChange={(e) => setFormData({ ...formData, contato_id: e.target.value })}
            >
              <option value="">Selecione um contato (opcional)</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.nome} ({contact.tipo})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-checkbox">
            <input
              type="checkbox"
              id="recorrente"
              checked={formData.recorrente}
              onChange={(e) => setFormData({ ...formData, recorrente: e.target.checked })}
            />
            <label htmlFor="recorrente">Transação Recorrente</label>
          </div>

          <button type="submit" className="form-button">
            {transaction ? 'Atualizar' : 'Criar'} Transação
          </button>
        </form>
      </div>
    </div>
  )
}