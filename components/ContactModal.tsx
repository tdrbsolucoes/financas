import React, { useState, useEffect } from 'react'
import { Contact } from '../src/lib/supabase'
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
    phone: '',
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
        phone: contact.email || '', // Temporariamente usando email como phone até migração
        recurringActive: contact.recurring_charge?.isActive || false,
        recurringAmount: contact.recurring_charge?.amount?.toString() || '',
        recurringLaunchDay: contact.recurring_charge?.launchDay?.toString() || '1',
        recurringDueDay: contact.recurring_charge?.dueDay?.toString() || '10'
      })
    }
  }, [contact])

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica a máscara (11) 99999-9999
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
        .replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
        .replace(/(\d{2})(\d{0,5})/, '($1) $2')
        .replace(/(\d{0,2})/, '($1')
    }
    return value
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setFormData(prev => ({ ...prev, phone: formatted }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar campos obrigatórios
    if (!formData.name.trim()) {
      alert('Nome é obrigatório')
      return
    }
    
    if (formData.recurringActive) {
      if (!formData.recurringAmount || parseFloat(formData.recurringAmount) <= 0) {
        alert('Valor da cobrança recorrente é obrigatório')
        return
      }
    }
    
    const contactData: Omit<Contact, 'id' | 'created_at'> = {
      user_id: '', // Será preenchido pelo componente pai
      name: formData.name,
      type: formData.type,
      email: formData.phone || undefined, // Temporariamente salvando phone no campo email
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
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label htmlFor="phone" style={{ flex: '1' }}>Celular</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="form-button" style={{ padding: '0.5rem 1rem', margin: '0' }}>
                  {contact ? 'Alterar' : 'Incluir'}
                </button>
              </div>
            </div>
            <input
              id="phone"
              type="tel"
              placeholder="DD+Número (ex: 11999999999)"
              value={formData.phone}
              onChange={handlePhoneChange}
              maxLength={13}
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
                  <label htmlFor="recurringAmount">Valor Mensal (R$) *</label>
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
                  <label htmlFor="recurringLaunchDay">Dia Lançamento</label>
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
                  <label htmlFor="recurringDueDay">Dia Vencimento</label>
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

        </form>
      </div>
    </div>
  )
}

export default ContactModal