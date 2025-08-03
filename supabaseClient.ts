import { createClient } from '@supabase/supabase-js'

// Configuração do cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não encontradas. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface Contact {
  id: string
  user_id: string
  created_at: string
  name: string
  type: 'empresa' | 'cliente'
  email?: string
  recurring_charge?: {
    isActive: boolean
    amount: number
    launchDay: number
    dueDay: number
  }
}

export interface Transaction {
  id: string
  user_id: string
  created_at: string
  description: string
  amount: number
  date: string
  due_date: string
  type: 'income' | 'expense'
  is_paid: boolean
  paid_date?: string
  is_recurring: boolean
  contact_id?: string
  contact?: Contact
}

// Funções de autenticação
export const authService = {
  // Login com email e senha
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Cadastro com email e senha
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    return { data, error }
  },

  // Logout
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Obter usuário atual
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Escutar mudanças de autenticação
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Funções para gerenciar contatos
export const contactsService = {
  // Buscar todos os contatos do usuário
  async getContacts(userId: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Criar novo contato
  async createContact(contact: Omit<Contact, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('contacts')
      .insert([contact])
      .select()
      .single()
    
    return { data, error }
  },

  // Atualizar contato
  async updateContact(id: string, updates: Partial<Contact>) {
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  // Deletar contato
  async deleteContact(id: string) {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
    
    return { error }
  }
}

// Funções para gerenciar transações
export const transactionsService = {
  // Buscar todas as transações do usuário
  async getTransactions(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: false })
    
    if (error) return { data: null, error }
    
    // Buscar contatos separadamente e fazer o join manualmente
    const contactIds = data?.map(t => t.contact_id).filter(Boolean) || []
    let contactsMap: Record<string, Contact> = {}
    
    if (contactIds.length > 0) {
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .in('id', contactIds)
      
      if (contacts) {
        contactsMap = contacts.reduce((acc, contact) => {
          acc[contact.id] = contact
          return acc
        }, {} as Record<string, Contact>)
      }
    }
    
    // Adicionar contatos às transações
    const transactionsWithContacts = data?.map(transaction => ({
      ...transaction,
      contact: transaction.contact_id ? contactsMap[transaction.contact_id] : undefined
    }))
    
    return { data: transactionsWithContacts, error: null }
  },

  // Criar nova transação
  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select('*')
      .single()
    
    if (error) return { data: null, error }
    
    // Buscar contato se existir
    let contact = undefined
    if (data?.contact_id && data.contact_id.trim() !== '' && data.contact_id !== 'null') {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', data.contact_id)
        .single()
      contact = contactData
    }
    
    return { data: { ...data, contact }, error: null }
  },

  // Atualizar transação
  async updateTransaction(id: string, updates: Partial<Transaction>) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) return { data: null, error }
    
    // Buscar contato se existir
    let contact = undefined
    if (data?.contact_id && data.contact_id.trim() !== '' && data.contact_id !== 'null') {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', data.contact_id)
        .single()
      contact = contactData
    }
    
    return { data: { ...data, contact }, error: null }
  },

  // Marcar transação como paga
  async markAsPaid(id: string, paidDate: string) {
    const { data, error } = await supabase
      .from('transactions')
      .update({ 
        is_paid: true, 
        paid_date: paidDate 
      })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) return { data: null, error }
    
    // Buscar contato se existir
    let contact = undefined
    if (data?.contact_id && data.contact_id.trim() !== '' && data.contact_id !== 'null') {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', data.contact_id)
        .single()
      contact = contactData
    }
    
    return { data: { ...data, contact }, error: null }
  },

  // Deletar transação
  async deleteTransaction(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
    
    return { error }
  },

  // Buscar transações por período
  async getTransactionsByPeriod(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .order('due_date', { ascending: false })
    
    if (error) return { data: null, error }
    
    // Buscar contatos separadamente e fazer o join manualmente
    const contactIds = data?.map(t => t.contact_id).filter(Boolean) || []
    let contactsMap: Record<string, Contact> = {}
    
    if (contactIds.length > 0) {
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .in('id', contactIds)
      
      if (contacts) {
        contactsMap = contacts.reduce((acc, contact) => {
          acc[contact.id] = contact
          return acc
        }, {} as Record<string, Contact>)
      }
    }
    
    // Adicionar contatos às transações
    const transactionsWithContacts = data?.map(transaction => ({
      ...transaction,
      contact: transaction.contact_id ? contactsMap[transaction.contact_id] : undefined
    }))
    
    return { data: transactionsWithContacts, error: null }
  }
}