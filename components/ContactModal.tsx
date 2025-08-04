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
    <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-w-lg p-0 rounded-xl overflow-hidden w-[95%] max-w-[95vw] mx-4">
        <div className="bg-card p-6 border-b border-border mb-0">
          <h3 className="text-xl font-semibold text-foreground m-0">Cadastro de {contact ? 'Edição de ' : ''}Cliente</h3>
          <button className="absolute top-4 right-4 bg-transparent border-none text-xl cursor-pointer text-muted-foreground" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="p-8 bg-card flex flex-col gap-2" onSubmit={handleSubmit}>
          {/* Tipo de Contato - Botões Modernos */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              className={`flex-1 p-3 border rounded-lg font-medium cursor-pointer transition-all duration-200 ${
                formData.type === 'cliente' 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'border-border bg-card text-muted-foreground hover:border-primary hover:bg-accent'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'cliente' }))}
            >
              Pessoa Física
            </button>
            <button
              type="button"
              className={`flex-1 p-3 border rounded-lg font-medium cursor-pointer transition-all duration-200 ${
                formData.type === 'empresa' 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'border-border bg-card text-muted-foreground hover:border-primary hover:bg-accent'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'empresa' }))}
            >
              Pessoa Jurídica
            </button>
          </div>

          {/* Nome Completo */}
          <div className="flex flex-col gap-1.5 mb-4 relative">
            <label htmlFor="name" className="font-medium text-xs text-foreground absolute -top-2 left-3 bg-card px-1 z-10">Nome Completo</label>
            <input
              id="name"
              type="text"
              className="p-3 border border-border bg-input text-foreground rounded-lg text-base transition-colors focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
              placeholder="Ex: João da Silva"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Telefone */}
          <div className="flex flex-col gap-1.5 mb-4 relative">
            <label htmlFor="phone" className="font-medium text-xs text-foreground absolute -top-2 left-3 bg-card px-1 z-10">Telefone</label>
            <input
              id="phone"
              type="tel"
              className="p-3 border border-border bg-input text-foreground rounded-lg text-base transition-colors focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={handlePhoneChange}
              maxLength={15}
            />
          </div>

          {/* Checkbox Faturamento Recorrente */}
          <div className="flex items-center gap-3 py-2">
            <input
              id="recurring"
              type="checkbox"
              className="w-4.5 h-4.5 accent-primary cursor-pointer"
              checked={formData.recurringActive}
              onChange={(e) => setFormData(prev => ({ ...prev, recurringActive: e.target.checked }))}
            />
            <label htmlFor="recurring" className="font-medium text-foreground cursor-pointer select-none">Adicionar Faturamento Recorrente</label>
          </div>

          {/* Seção Recorrente */}
          {formData.recurringActive && (
            <div className="flex flex-col gap-3 p-6 bg-muted rounded-lg border border-border mt-2">
              <div className="flex flex-col gap-1.5 mb-4 relative">
                <label htmlFor="recurringLaunchDay" className="font-medium text-xs text-foreground absolute -top-2 left-3 bg-muted px-1 z-10">Dia de Lançamento</label>
                <input
                  id="recurringLaunchDay"
                  type="number"
                  className="p-3 border border-border bg-input text-foreground rounded-lg text-base transition-colors focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                  min="1"
                  max="31"
                  placeholder="Ex: 5"
                  value={formData.recurringLaunchDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurringLaunchDay: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5 mb-4 relative">
                <label htmlFor="recurringDueDay" className="font-medium text-xs text-foreground absolute -top-2 left-3 bg-muted px-1 z-10">Dia de Pagamento</label>
                <input
                  id="recurringDueDay"
                  type="number"
                  className="p-3 border border-border bg-input text-foreground rounded-lg text-base transition-colors focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                  min="1"
                  max="31"
                  placeholder="Ex: 15"
                  value={formData.recurringDueDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurringDueDay: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5 mb-4 relative">
                <label htmlFor="recurringAmount" className="font-medium text-xs text-foreground absolute -top-2 left-3 bg-muted px-1 z-10">Valor (R$)</label>
                <input
                  id="recurringAmount"
                  type="number"
                  className="p-3 border border-border bg-input text-foreground rounded-lg text-base transition-colors focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
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
          <button type="submit" className="w-full p-3.5 bg-gray-600 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-colors hover:bg-gray-700 mt-2">
            Cadastrar Cliente
          </button>
        </form>
      </div>
    </div>
  )
}

export default ContactModal