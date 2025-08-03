import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos do banco de dados seguindo as melhores práticas
export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          name: string;
          type: 'empresa' | 'cliente';
          email: string | null;
          recurring_charge: {
            isActive: boolean;
            amount: number;
            launchDay: number;
            dueDay: number;
          } | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          name: string;
          type: 'empresa' | 'cliente';
          email?: string | null;
          recurring_charge?: {
            isActive: boolean;
            amount: number;
            launchDay: number;
            dueDay: number;
          } | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          name?: string;
          type?: 'empresa' | 'cliente';
          email?: string | null;
          recurring_charge?: {
            isActive: boolean;
            amount: number;
            launchDay: number;
            dueDay: number;
          } | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          description: string;
          amount: number;
          date: string;
          due_date: string;
          type: 'income' | 'expense';
          is_paid: boolean;
          paid_date: string | null;
          is_recurring: boolean;
          contact_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          description: string;
          amount: number;
          date: string;
          due_date: string;
          type: 'income' | 'expense';
          is_paid?: boolean;
          paid_date?: string | null;
          is_recurring?: boolean;
          contact_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          description?: string;
          amount?: number;
          date?: string;
          due_date?: string;
          type?: 'income' | 'expense';
          is_paid?: boolean;
          paid_date?: string | null;
          is_recurring?: boolean;
          contact_id?: string | null;
        };
      };
    };
  };
}

// Tipos para uso na aplicação
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
export type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

export type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  contact?: Contact;
};
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

// Função para validar UUID
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Funções de autenticação
export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Funções para gerenciar contatos
export const contactsService = {
  async getContacts(userId: string) {
    if (!userId || !isValidUUID(userId)) {
      return { data: null, error: new Error('Invalid user ID') };
    }

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async createContact(contact: ContactInsert) {
    if (!contact.user_id || !isValidUUID(contact.user_id)) {
      return { data: null, error: new Error('Invalid user ID') };
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert([contact])
      .select()
      .single();
    
    return { data, error };
  },

  async updateContact(id: string, updates: ContactUpdate) {
    if (!id || !isValidUUID(id)) {
      return { data: null, error: new Error('Invalid contact ID') };
    }

    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  async deleteContact(id: string) {
    if (!id || !isValidUUID(id)) {
      return { error: new Error('Invalid contact ID') };
    }

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    return { error };
  }
};

// Funções para gerenciar transações
export const transactionsService = {
  async getTransactions(userId: string) {
    if (!userId || !isValidUUID(userId)) {
      return { data: null, error: new Error('Invalid user ID') };
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: false });
    
    if (error) return { data: null, error };
    
    // Buscar contatos separadamente para fazer join manual
    const contactIds = data?.map(t => t.contact_id).filter(id => id && isValidUUID(id)) || [];
    let contactsMap: Record<string, Contact> = {};
    
    if (contactIds.length > 0) {
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .in('id', contactIds);
      
      if (contacts) {
        contactsMap = contacts.reduce((acc, contact) => {
          acc[contact.id] = contact;
          return acc;
        }, {} as Record<string, Contact>);
      }
    }
    
    // Adicionar contatos às transações
    const transactionsWithContacts = data?.map(transaction => ({
      ...transaction,
      contact: transaction.contact_id && contactsMap[transaction.contact_id] 
        ? contactsMap[transaction.contact_id] 
        : undefined
    }));
    
    return { data: transactionsWithContacts, error: null };
  },

  async createTransaction(transaction: TransactionInsert) {
    if (!transaction.user_id || !isValidUUID(transaction.user_id)) {
      return { data: null, error: new Error('Invalid user ID') };
    }

    // Validar contact_id se fornecido
    if (transaction.contact_id && !isValidUUID(transaction.contact_id)) {
      return { data: null, error: new Error('Invalid contact ID') };
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select('*')
      .single();
    
    if (error) return { data: null, error };
    
    // Buscar contato se existir
    let contact = undefined;
    if (data?.contact_id && isValidUUID(data.contact_id)) {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', data.contact_id)
        .single();
      contact = contactData;
    }
    
    return { data: { ...data, contact }, error: null };
  },

  async updateTransaction(id: string, updates: TransactionUpdate) {
    if (!id || !isValidUUID(id)) {
      return { data: null, error: new Error('Invalid transaction ID') };
    }

    // Validar contact_id se fornecido
    if (updates.contact_id && !isValidUUID(updates.contact_id)) {
      return { data: null, error: new Error('Invalid contact ID') };
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) return { data: null, error };
    
    // Buscar contato se existir
    let contact = undefined;
    if (data?.contact_id && isValidUUID(data.contact_id)) {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', data.contact_id)
        .single();
      contact = contactData;
    }
    
    return { data: { ...data, contact }, error: null };
  },

  async markAsPaid(id: string, paidDate: string) {
    return this.updateTransaction(id, { 
      is_paid: true, 
      paid_date: paidDate 
    });
  },

  async deleteTransaction(id: string) {
    if (!id || !isValidUUID(id)) {
      return { error: new Error('Invalid transaction ID') };
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    return { error };
  },

  async getTransactionsByPeriod(userId: string, startDate: string, endDate: string) {
    if (!userId || !isValidUUID(userId)) {
      return { data: null, error: new Error('Invalid user ID') };
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .order('due_date', { ascending: false });
    
    if (error) return { data: null, error };
    
    // Buscar contatos separadamente para fazer join manual
    const contactIds = data?.map(t => t.contact_id).filter(id => id && isValidUUID(id)) || [];
    let contactsMap: Record<string, Contact> = {};
    
    if (contactIds.length > 0) {
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .in('id', contactIds);
      
      if (contacts) {
        contactsMap = contacts.reduce((acc, contact) => {
          acc[contact.id] = contact;
          return acc;
        }, {} as Record<string, Contact>);
      }
    }
    
    // Adicionar contatos às transações
    const transactionsWithContacts = data?.map(transaction => ({
      ...transaction,
      contact: transaction.contact_id && contactsMap[transaction.contact_id] 
        ? contactsMap[transaction.contact_id] 
        : undefined
    }));
    
    return { data: transactionsWithContacts, error: null };
  }
};