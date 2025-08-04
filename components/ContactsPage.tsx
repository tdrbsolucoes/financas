import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { contactsService, Contact } from '../src/lib/supabase'
import { Plus, Edit, Trash2, Building, User as UserIcon, RefreshCw } from 'lucide-react'
import ContactModal from './ContactModal'
import ConfirmationModal from './ConfirmationModal'

interface ContactsPageProps {
  user: User
}

const ContactsPage: React.FC<ContactsPageProps> = ({ user }) => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'empresa' | 'cliente'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)

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
        const { data, error } = await contactsService.updateContact(editingContact.id, contactData)
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
    if (filter === 'all') return true
    return contact.type === filter
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

      <div className="page-header">
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
            Empresas
          </button>
          <button
            className={filter === 'cliente' ? 'active' : ''}
            onClick={() => setFilter('cliente')}
          >
            Clientes
          </button>
        </div>
      </div>

      <div className="card">
        {filteredContacts.length === 0 ? (
          <div className="empty-state">
            <p>
              {filter === 'all' 
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
                  <h4>
                    {contact.type === 'empresa' ? <Building size={16} /> : <UserIcon size={16} />}
                    {contact.name}
                  </h4>
                  <p>
                    {contact.type === 'empresa' ? 'Empresa' : 'Cliente'}
                    {contact.email && ` • ${contact.email}`}
                  </p>
                  {contact.recurring_charge?.isActive && (
                    <div className="recurring-tag">
                      <RefreshCw size={14} />
                      {formatCurrency(contact.recurring_charge.amount)} • 
                      Lanç: {contact.recurring_charge.launchDay} • 
                      Venc: {contact.recurring_charge.dueDay}
                    </div>
                  )}
                </div>
                <div className="item-actions">
                  <button
                    className="action-button"
                    onClick={() => {
                      setEditingContact(contact)
                      setShowModal(true)
                    }}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="action-button"
                    onClick={() => {
                      setContactToDelete(contact)
                      setShowDeleteModal(true)
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="fab"
        onClick={() => {
          setEditingContact(null)
          setShowModal(true)
        }}
      >
        <Plus />
      </button>

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