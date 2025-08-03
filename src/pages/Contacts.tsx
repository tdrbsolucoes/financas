import React, { useState } from 'react'
import { useContacts } from '../hooks/useContacts'
import { ContactModal } from '../components/ContactModal'
import { Database } from '../types/database'

type Contact = Database['public']['Tables']['contatos']['Row']

export function Contacts() {
  const { contacts, loading, createContact, updateContact, deleteContact } = useContacts()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [filter, setFilter] = useState<'all' | 'empresa' | 'cliente'>('all')

  const filteredContacts = contacts.filter(contact => {
    if (filter === 'all') return true
    return contact.tipo === filter
  })

  const handleSaveContact = async (contactData: any) => {
    try {
      if (editingContact) {
        await updateContact(editingContact.id, contactData)
      } else {
        await createContact(contactData)
      }
      setIsModalOpen(false)
      setEditingContact(null)
    } catch (error) {
      console.error('Erro ao salvar contato:', error)
    }
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setIsModalOpen(true)
  }

  const handleDeleteContact = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este contato?')) {
      await deleteContact(id)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div>
        <div className="header">
          <h2>Contatos</h2>
        </div>
        <div className="page-content">
          <p>Carregando contatos...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="header">
        <h2>Contatos</h2>
      </div>
      
      <div className="page-content">
        <div className="page-header">
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              Todos
            </button>
            <button 
              className={filter === 'cliente' ? 'active' : ''}
              onClick={() => setFilter('cliente')}
            >
              Clientes
            </button>
            <button 
              className={filter === 'empresa' ? 'active' : ''}
              onClick={() => setFilter('empresa')}
            >
              Empresas
            </button>
          </div>
        </div>

        {filteredContacts.length === 0 ? (
          <p className="empty-state">
            {filter === 'all' ? 'Nenhum contato encontrado.' : `Nenhum ${filter} encontrado.`}
          </p>
        ) : (
          <div className="data-list">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="card data-item">
                <div className="item-content">
                  <h4>
                    {contact.tipo === 'empresa' ? '🏢' : '👤'} {contact.nome}
                  </h4>
                  <p>
                    {contact.tipo === 'empresa' ? 'Empresa' : 'Cliente'}
                    {contact.email && ` • ${contact.email}`}
                  </p>
                  {contact.cobranca_recorrente_ativa && (
                    <div className="recurring-tag">
                      <span>🔄</span>
                      Cobrança: {formatCurrency(Number(contact.cobranca_recorrente_valor))} 
                      (Dia {contact.cobranca_recorrente_dia_vencimento})
                    </div>
                  )}
                </div>
                <div className="item-actions">
                  <button
                    className="action-button"
                    onClick={() => handleEditContact(contact)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-button"
                    onClick={() => handleDeleteContact(contact.id)}
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button 
          className="fab"
          onClick={() => {
            setEditingContact(null)
            setIsModalOpen(true)
          }}
        >
          +
        </button>

        <ContactModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingContact(null)
          }}
          onSave={handleSaveContact}
          contact={editingContact}
        />
      </div>
    </div>
  )
}