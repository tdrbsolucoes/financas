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
        phone: contact.phone || '',
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
      phone: formData.phone || undefined,
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
      <div className="modal-content contact-modal">
        <div className="modal-header">
          <h3>{contact ? 'Editar Contato' : 'Cadastro de Cliente'}</h3>
          <button className="close-button" onClick={onClose}>
            <X />
          </button>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          {/* Tipo de Cliente - Radio Buttons */}
          <div className="customer-type-section">
            <div className="radio-group">
              <label className={`radio-option ${formData.type === 'cliente' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="customerType"
                  value="cliente"
                  checked={formData.type === 'cliente'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: 'cliente' }))}
                />
                <div className="radio-content">
                  <User size={18} />
                  <span>Pessoa Física</span>
                </div>
              </label>
              <label className={`radio-option ${formData.type === 'empresa' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="customerType"
                  value="empresa"
                  checked={formData.type === 'empresa'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: 'empresa' }))}
                />
                <div className="radio-content">
                  <Building size={18} />
                  <span>Pessoa Jurídica</span>
                </div>
              </label>
            </div>
          </div>

          {/* Nome Completo */}
          <div className="input-group">
            <label htmlFor="name">Nome Completo</label>
            <div className="input-with-buttons">
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={formData.type === 'empresa' ? 'Ex: Empresa LTDA' : 'Ex: João da Silva'}
                required
              />
              <button type="submit" className="inline-submit-btn">
                {contact ? 'Alterar' : 'Incluir'}
              </button>
            </div>
          </div>

          {/* Telefone */}
          <div className="input-group">
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

          {/* Faturamento Recorrente */}
          <div className="recurring-section">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.recurringActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurringActive: e.target.checked }))}
                />
                <span className="checkmark"></span>
                <span className="checkbox-text">Adicionar Faturamento Recorrente</span>
              </label>
            </div>

            {/* Seção de Cobrança Recorrente */}
            <div className={`recurring-details ${formData.recurringActive ? 'visible' : ''}`}>
              <div className="recurring-grid">
                <div className="input-group">
                  <label htmlFor="launchDay">Dia de Lançamento</label>
                  <input
                    id="launchDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.recurringLaunchDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurringLaunchDay: e.target.value }))}
                    placeholder="Ex: 5"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="dueDay">Dia de Pagamento</label>
                  <input
                    id="dueDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.recurringDueDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurringDueDay: e.target.value }))}
                    placeholder="Ex: 15"
                  />
                </div>
                <div className="input-group amount-group">
                  <label htmlFor="amount">Valor (R$)</label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.recurringAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurringAmount: e.target.value }))}
                    placeholder="Ex: 250,00"
                    required={formData.recurringActive}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContactModal