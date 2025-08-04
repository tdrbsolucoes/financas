import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { contactsService, Contact } from '../src/lib/supabase'
import { Plus, Edit, Trash2, Building, User as UserIcon, RefreshCw, Filter } from 'lucide-react'
import ContactModal from './ContactModal'
import ConfirmationModal from './ConfirmationModal'

interface ContactsPageProps {
  user: User
  onDatabaseError?: (error: any) => void
}

const ContactsPage: React.FC<ContactsPageProps> = ({ user, onDatabaseError }) => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'empresa' | 'cliente'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadContacts()
  }, [user])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const { data, error } = await contactsService.getContacts(user.id)
      
      if (error) throw error
      
      setContacts(data || [])
    } catch (error: any) {
      if (onDatabaseError) {
        onDatabaseError(error)
        return
      }
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveContact = async (contactData: Omit<Contact, 'id' | 'created_at'>) => {
    try {
      if (editingContact) {
        // Remove user_id from update data to prevent empty string UUID error
        const { user_id, ...updateData } = contactData
        const { data, error } = await contactsService.updateContact(editingContact.id, updateData)
        if (error) throw error
        
        setContacts(prev => prev.map(c => c.id === editingContact.id ? data : c))
      } else {
        // Ensure user_id is present for new contacts
        if (!user.id) {
          throw new Error('User ID is required to create a contact')
        }
        const { data, error } = await contactsService.createContact({
          ...contactData,
          user_id: user.id
        })
        if (error) throw error
        
        setContacts(prev => [data, ...prev])
      }
      
      setShowModal(false)
      setEditingContact(null)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleDeleteContact = async () => {
    if (!contactToDelete) return

    try {
      const { error } = await contactsService.deleteContact(contactToDelete.id)
      if (error) throw error
      
      setContacts(prev => prev.filter(c => c.id !== contactToDelete.id))
      setShowDeleteModal(false)
      setContactToDelete(null)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const typeMatch = filter === 'all' || contact.type === filter
    const searchMatch = searchTerm === '' || 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.phone && contact.phone.includes(searchTerm))
    return typeMatch && searchMatch
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Carregando contatos...</p>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={20} />
          Filtros e Busca
        </h3>
        
        {/* Busca */}
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ marginBottom: '1rem', maxWidth: '300px' }}
        />
        
        {/* Filtros por Tipo */}
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button
            className={filter === 'empresa' ? 'active' : ''}
            onClick={() => setFilter('empresa')}
          >
            <Building size={16} style={{ marginRight: '0.25rem' }} />
            Empresas
          </button>
          <button
            className={filter === 'cliente' ? 'active' : ''}
            onClick={() => setFilter('cliente')}
          >
            <UserIcon size={16} style={{ marginRight: '0.25rem' }} />
            Clientes
          </button>
        </div>
      </div>

      {/* Lista de Contatos */}
      <div className="card">
        <h3 style={{ margin: '0 0 1rem 0' }}>
          Contatos ({filteredContacts.length})
        </h3>
        
        {filteredContacts.length === 0 ? (
          <div className="empty-state">
            <p>
              {searchTerm 
                ? 'Nenhum contato encontrado com os critérios de busca.'
                : filter === 'all' 
                  ? 'Nenhum contato cadastrado. Clique no botão + para adicionar o primeiro!'
                  : `Nenhum ${filter} cadastrado.`
              }
            </p>
          </div>
        ) : (
          <div className="data-list">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="data-item">
                <div className="item-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {contact.type === 'empresa' ? 
                      <Building size={18} style={{ color: '#2563eb' }} /> : 
                      <UserIcon size={18} style={{ color: '#16a34a' }} />
                    }
                    <h4 style={{ margin: 0 }}>{contact.name}</h4>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      contact.type === 'empresa' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {contact.type === 'empresa' ? 'Empresa' : 'Cliente'}
                    </span>
                    {contact.phone && (
                      <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        {contact.phone}
                      </span>
                    )}
                  </div>
                  
                  {contact.recurring_charge?.isActive && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-xs font-medium" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <RefreshCw size={12} />
                      {formatCurrency(contact.recurring_charge.amount)}
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setEditingContact(contact)
                      setShowModal(true)
                    }}
                    className="p-2 rounded-lg border-none bg-blue-100 text-blue-600 cursor-pointer transition-all hover:bg-blue-200"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setContactToDelete(contact)
                      setShowDeleteModal(true)
                    }}
                    className="p-2 rounded-lg border-none bg-red-100 text-red-600 cursor-pointer transition-all hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botão Flutuante */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white border-none rounded-full shadow-lg cursor-pointer transition-all hover:bg-blue-700 flex items-center justify-center"
        onClick={() => {
          setEditingContact(null)
          setShowModal(true)
        }}
      >
        <Plus size={24} />
      </button>

      {/* Modais */}
      {showModal && (
        <ContactModal
          contact={editingContact}
          onSave={handleSaveContact}
          onClose={() => {
            setShowModal(false)
            setEditingContact(null)
          }}
        />
      )}

      {showDeleteModal && contactToDelete && (
        <ConfirmationModal
          title="Excluir Contato"
          message={`Tem certeza que deseja excluir "${contactToDelete.name}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDeleteContact}
          onCancel={() => {
            setShowDeleteModal(false)
            setContactToDelete(null)
          }}
        />
      )}
    </div>
  )
}

export default ContactsPage