import React, { useState, useEffect } from 'react'
import { Contact } from '../src/lib/supabase'
import { X } from 'lucide-react'

interface ContactModalProps {
  contact: Contact | null
  onSave: (contact: Omit<Contact, 'id' | 'created_at'>) => void
  onClose: () => void
}

const ContactModal: React.FC<ContactModalProps> = ({ contact, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'cliente' as 'empresa' | 'cliente',
    email: '',
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
        email: contact.email || '',
        phone: contact.phone || '',
        recurringActive: contact.recurring_charge?.isActive || false,
        recurringAmount: contact.recurring_charge?.amount?.toString() || '',
        recurringLaunchDay: contact.recurring_charge?.launchDay?.toString() || '1',
        recurringDueDay: contact.recurring_charge?.dueDay?.toString() || '10'
      })
    }
  }, [contact])

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 11) {
      if (numbers.length <= 2) {
        return `(${numbers}`
      } else if (numbers.length <= 7) {
        return `(${numbers.substr(0, 2)}) ${numbers.substr(2)}`
      } else {
        return `(${numbers.substr(0, 2)}) ${numbers.substr(2, 5)}-${numbers.substr(7)}`
      }
    }
    return value
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setFormData(prev => ({ ...prev, phone: formatted }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
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
      user_id: '',
      name: formData.name,
      type: formData.type,
      email: formData.email || null,
      phone: formData.phone || null,
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
      <div className="modal-content modern-modal">
        <div className="modal-header modern-header">
          <h3>Cadastro de {contact ? 'Edição de ' : ''}Cliente</h3>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="modern-form" onSubmit={handleSubmit}>
          {/* Tipo de Contato - Botões Modernos */}
          <div className="type-selector-modern">
            <button
              type="button"
              className={`type-button-modern ${formData.type === 'cliente' ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'cliente' }))}
            >
              Pessoa Física
            </button>
            <button
              type="button"
              className={`type-button-modern ${formData.type === 'empresa' ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'empresa' }))}
            >
              Pessoa Jurídica
            </button>
          </div>

          {/* Nome Completo */}
          <div className="form-group-modern">
            <label htmlFor="name">Nome Completo</label>
            <input
              id="name"
              type="text"
              placeholder="Ex: João da Silva"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Telefone */}
          <div className="form-group-modern">
            <label htmlFor="phone">Telefone</label>
            <input
              id="phone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={handlePhoneChange}
              maxLength={15}
            />
          </div>

          {/* Checkbox Faturamento Recorrente */}
          <div className="checkbox-modern">
            <input
              id="recurring"
              type="checkbox"
              checked={formData.recurringActive}
              onChange={(e) => setFormData(prev => ({ ...prev, recurringActive: e.target.checked }))}
            />
            <label htmlFor="recurring">Adicionar Faturamento Recorrente</label>
          </div>

          {/* Seção Recorrente */}
          {formData.recurringActive && (
            <div className="recurring-section-modern">
              <div className="form-group-modern">
                <label htmlFor="recurringLaunchDay">Dia de Lançamento</label>
                <input
                  id="recurringLaunchDay"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 5"
                  value={formData.recurringLaunchDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurringLaunchDay: e.target.value }))}
                />
              </div>

              <div className="form-group-modern">
                <label htmlFor="recurringDueDay">Dia de Pagamento</label>
                <input
                  id="recurringDueDay"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 15"
                  value={formData.recurringDueDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurringDueDay: e.target.value }))}
                />
              </div>

              <div className="form-group-modern">
                <label htmlFor="recurringAmount">Valor (R$)</label>
                <input
                  id="recurringAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 250,00"
                  value={formData.recurringAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurringAmount: e.target.value }))}
                  required={formData.recurringActive}
                />
              </div>
            </div>
          )}

          {/* Botão de Submit */}
          <button type="submit" className="submit-button-modern">
            Cadastrar Cliente
          </button>
        </form>
      </div>
    </div>
  )
}

export default ContactModal