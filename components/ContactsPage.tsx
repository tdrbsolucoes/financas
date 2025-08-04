import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { contactsService, Contact } from '../src/lib/supabase'
import { Plus, Edit, Trash2, Building, User as UserIcon, RefreshCw, Filter } from 'lucide-react'
import { Button } from '../src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/card'
import { Badge } from '../src/components/ui/badge'
import { Input } from '../src/components/ui/input'
import ContactModal from './ContactModal'
import ConfirmationModal from './ConfirmationModal'
import { cn } from '../src/lib/utils'

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
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={20} />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Busca */}
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            
            {/* Filtros por Tipo */}
            <div className="flex items-center gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={filter === 'empresa' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('empresa')}
              >
                <Building size={16} className="mr-1" />
                Empresas
              </Button>
              <Button
                variant={filter === 'cliente' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('cliente')}
              >
                <UserIcon size={16} className="mr-1" />
                Clientes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contatos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Contatos ({filteredContacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
        {filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
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
          <div className="grid gap-4">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {contact.type === 'empresa' ? 
                          <Building size={18} className="text-blue-600" /> : 
                          <UserIcon size={18} className="text-green-600" />
                        }
                        <h3 className="font-semibold text-lg">{contact.name}</h3>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={contact.type === 'empresa' ? 'default' : 'secondary'}>
                          {contact.type === 'empresa' ? 'Empresa' : 'Cliente'}
                        </Badge>
                        {contact.phone && (
                          <span className="text-sm text-muted-foreground">
                            {contact.phone}
                          </span>
                        )}
                      </div>
                      
                  {contact.recurring_charge?.isActive && (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          <RefreshCw size={12} className="mr-1" />
                          {formatCurrency(contact.recurring_charge.amount)}
                        </Badge>
                  )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                    onClick={() => {
                      setEditingContact(contact)
                      setShowModal(true)
                    }}
                        className="h-8 w-8"
                  >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                    onClick={() => {
                      setContactToDelete(contact)
                      setShowDeleteModal(true)
                    }}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                  >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </CardContent>
      </Card>

      {/* Botão Flutuante */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => {
          setEditingContact(null)
          setShowModal(true)
        }}
      >
        <Plus size={24} />
      </Button>

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