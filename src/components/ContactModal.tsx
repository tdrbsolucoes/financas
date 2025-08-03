import React, { useState, useEffect } from 'react'
import { Database } from '../types/database'

type Contact = Database['public']['Tables']['contatos']['Row']

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (contact: any) => void
  contact?: Contact | null
}

export function ContactModal({ isOpen, onClose, onSave, contact }: ContactModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'cliente' as 'empresa' | 'cliente',
    email: '',
    cobranca_recorrente_ativa: false,
    cobranca_recorrente_valor: '',
    cobranca_recorrente_dia_lancamento: '',
    cobranca_recorrente_dia_vencimento: ''
  })

  useEffect(() => {
    if (contact) {
      setFormData({
        nome: contact.nome,
        tipo: contact.tipo,
        email: contact.email || '',
        cobranca_recorrente_ativa: contact.cobranca_recorrente_ativa || false,
        cobranca_recorrente_valor: contact.cobranca_recorrente_valor?.toString() || '',
        cobranca_recorrente_dia_lancamento: contact.cobranca_recorrente_dia_lancamento?.toString() || '',
        cobranca_recorrente_dia_vencimento: contact.cobranca_recorrente_dia_vencimento?.toString() || ''
      })
    } else {
      setFormData({
        nome: '',
        tipo: 'cliente',
        email: '',
        cobranca_recorrente_ativa: false,
        cobranca_recorrente_valor: '',
        cobranca_recorrente_dia_lancamento: '',
        cobranca_recorrente_dia_vencimento: ''
      })
    }
  }, [contact])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const contactData = {
      nome: formData.nome,
      tipo: formData.tipo,
      email: formData.email || null,
      cobranca_recorrente_ativa: formData.cobranca_recorrente_ativa,
      cobranca_recorrente_valor: formData.cobranca_recorrente_valor ? parseFloat(formData.cobranca_recorrente_valor) : null,
      cobranca_recorrente_dia_lancamento: formData.cobranca_recorrente_dia_lancamento ? parseInt(formData.cobranca_recorrente_dia_lancamento) : null,
      cobranca_recorrente_dia_vencimento: formData.cobranca_recorrente_dia_vencimento ? parseInt(formData.cobranca_recorrente_dia_vencimento) : null
    }

    onSave(contactData)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{contact ? 'Editar Contato' : 'Novo Contato'}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>

          <fieldset className="contact-type-fieldset">
            <legend>Tipo de Contato</legend>
            <div className="contact-type-selector">
              <button
                type="button"
                className={`contact-type-button ${formData.tipo === 'cliente' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, tipo: 'cliente' })}
              >
                <span>👤</span>
                Cliente
              </button>
              <button
                type="button"
                className={`contact-type-button ${formData.tipo === 'empresa' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, tipo: 'empresa' })}
              >
                <span>🏢</span>
                Empresa
              </button>
            </div>
          </fieldset>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="recurring-form-section">
            <div className="recurring-toggle">
              <label>Cobrança Recorrente</label>
              <input
                type="checkbox"
                checked={formData.cobranca_recorrente_ativa}
                onChange={(e) => setFormData({ ...formData, cobranca_recorrente_ativa: e.target.checked })}
              />
            </div>

            {formData.cobranca_recorrente_ativa && (
              <div className="recurring-fields">
                <div className="form-group">
                  <label>Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cobranca_recorrente_valor}
                    onChange={(e) => setFormData({ ...formData, cobranca_recorrente_valor: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Dia do Lançamento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.cobranca_recorrente_dia_lancamento}
                    onChange={(e) => setFormData({ ...formData, cobranca_recorrente_dia_lancamento: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Dia do Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.cobranca_recorrente_dia_vencimento}
                    onChange={(e) => setFormData({ ...formData, cobranca_recorrente_dia_vencimento: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="form-button">
            {contact ? 'Atualizar' : 'Criar'} Contato
          </button>
        </form>
      </div>
    </div>
  )
}