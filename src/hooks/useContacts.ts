import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Database } from '../types/database'

type Contact = Database['public']['Tables']['contatos']['Row']
type ContactInsert = Database['public']['Tables']['contatos']['Insert']
type ContactUpdate = Database['public']['Tables']['contatos']['Update']

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchContacts = async () => {
    if (!user) return

    setLoading(true)
    const { data, error } = await supabase
      .from('contatos')
      .select('*')
      .eq('user_id', user.id)
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('Erro ao buscar contatos:', error)
    } else {
      setContacts(data || [])
    }
    setLoading(false)
  }

  const createContact = async (contact: Omit<ContactInsert, 'user_id'>) => {
    if (!user) return { error: 'Usuário não autenticado' }

    const { data, error } = await supabase
      .from('contatos')
      .insert({ ...contact, user_id: user.id })
      .select()
      .single()

    if (!error && data) {
      setContacts(prev => [data, ...prev])
    }

    return { data, error }
  }

  const updateContact = async (id: string, updates: ContactUpdate) => {
    const { data, error } = await supabase
      .from('contatos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      setContacts(prev => prev.map(contact => 
        contact.id === id ? data : contact
      ))
    }

    return { data, error }
  }

  const deleteContact = async (id: string) => {
    const { error } = await supabase
      .from('contatos')
      .delete()
      .eq('id', id)

    if (!error) {
      setContacts(prev => prev.filter(contact => contact.id !== id))
    }

    return { error }
  }

  useEffect(() => {
    fetchContacts()
  }, [user])

  return {
    contacts,
    loading,
    createContact,
    updateContact,
    deleteContact,
    refetch: fetchContacts
  }
}