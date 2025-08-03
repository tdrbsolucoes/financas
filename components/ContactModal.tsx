import React, { useState, useEffect } from 'react'
import { Contact } from '../supabaseClient'
import { Building, User, X } from 'lucide-react'

interface ContactModalProps {
  contact: Contact | null
  onSave: (contact: Omit<Contact, 'id' | 'created_at'>) => void
  onClose: () => void
}

const ContactModal: React.FC<ContactModalProps> = ({ contact, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'empresa' as 'empresa' | 'cliente',
    email: '',
    recurringActive: false,
    recurringAmount: '',
    recurringLaunchDay: '1',
    recurringDueDay: '10'
  })

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        type: contact.type,
        email: contact.email || '',
        recurringActive: contact.recurring_charge?.isActive || false,
        recurringAmount: contact.recurring_charge?.amount?.toString() || '',
        recurringLaunchDay: contact.recurring_charge?.launchDay?.toString() || '1',
        recurringDueDay: contact.recurring_charge?.dueDay?.toString() || '10'
      })
    }
  }, [contact])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const contactData: Omit<Contact, 'id' | 'created_at'> = {
      user_id: '', // Será preenchido pelo componente pai
      name: formData.name,
      type: formData.type,
      email: formData.email || undefined,
      recurring_charge: formData.recurringActive ? {
        isActive: true,
        amount: parseFloat(formData.recurringAmount),
        launchDay: parseInt(formData.recurringLaunchDay),
        dueDay: parseInt(formData.recurringDueDay)
      } : undefined
    }

    onSave(contactData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{contact ? 'Editar Contato' : 'Novo Contato'}</h3>
          <button className="close-button" onClick={onClose}>
            <X />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <fieldset className="contact-type-fieldset">
            <legend>Tipo de Contato</legend>
            <div className="contact-type-selector">
              <button
                type="button"
                className={`contact-type-button ${formData.type === 'empresa' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'empresa' }))}
              >
                <Building />
                Empresa
              </button>
              <button
                type="button"
                className={`contact-type-button ${formData.type === 'cliente' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'cliente' }))}
              >
                <User />
                Cliente
              </button>
            </div>
          </fieldset>

          <div className="form-group">
            <label htmlFor="name">Nome *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="recurring-form-section">
            <div className="recurring-toggle">
              <label htmlFor="recurringActive">Cobrança Recorrente</label>
              <input
                id="recurringActive"
                type="checkbox"
                checked={formData.recurringActive}
                onChange={(e) => setFormData(prev => ({ ...prev, recurringActive: e.target.checked }))}
              />
            </div>

            {formData.recurringActive && (
              <div className="recurring-fields">
                <div className="form-group">
                  <label htmlFor="recurringAmount">Valor (R$) *</label>
                  <input
                    id="recurringAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.recurringAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurringAmount: e.target.value }))}
                    required={formData.recurringActive}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="recurringLaunchDay">Dia do Lançamento</label>
                  <select
                    id="recurringLaunchDay"
                    value={formData.recurringLaunchDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurringLaunchDay: e.target.value }))}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="recurringDueDay">Dia do Vencimento</label>
                  <select
                    id="recurringDueDay"
                    value={formData.recurringDueDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurringDueDay: e.target.value }))}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
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

export default ContactModal