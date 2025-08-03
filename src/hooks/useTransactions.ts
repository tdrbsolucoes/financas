import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Database } from '../types/database'

type Transaction = Database['public']['Tables']['transacoes']['Row'] & {
  contatos?: { nome: string } | null
}
type TransactionInsert = Database['public']['Tables']['transacoes']['Insert']
type TransactionUpdate = Database['public']['Tables']['transacoes']['Update']

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchTransactions = async () => {
    if (!user) return

    setLoading(true)
    const { data, error } = await supabase
      .from('transacoes')
      .select(`
        *,
        contatos (
          nome
        )
      `)
      .eq('user_id', user.id)
      .order('data_vencimento', { ascending: false })

    if (error) {
      console.error('Erro ao buscar transações:', error)
    } else {
      setTransactions(data || [])
    }
    setLoading(false)
  }

  const createTransaction = async (transaction: Omit<TransactionInsert, 'user_id'>) => {
    if (!user) return { error: 'Usuário não autenticado' }

    const { data, error } = await supabase
      .from('transacoes')
      .insert({ ...transaction, user_id: user.id })
      .select(`
        *,
        contatos (
          nome
        )
      `)
      .single()

    if (!error && data) {
      setTransactions(prev => [data, ...prev])
    }

    return { data, error }
  }

  const updateTransaction = async (id: number, updates: TransactionUpdate) => {
    const { data, error } = await supabase
      .from('transacoes')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        contatos (
          nome
        )
      `)
      .single()

    if (!error && data) {
      setTransactions(prev => prev.map(transaction => 
        transaction.id === id ? data : transaction
      ))
    }

    return { data, error }
  }

  const deleteTransaction = async (id: number) => {
    const { error } = await supabase
      .from('transacoes')
      .delete()
      .eq('id', id)

    if (!error) {
      setTransactions(prev => prev.filter(transaction => transaction.id !== id))
    }

    return { error }
  }

  const markAsPaid = async (id: number, paid: boolean) => {
    const updates: TransactionUpdate = {
      pago: paid,
      data_pagamento: paid ? new Date().toISOString().split('T')[0] : null
    }

    return updateTransaction(id, updates)
  }

  useEffect(() => {
    fetchTransactions()
  }, [user])

  return {
    transactions,
    loading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    markAsPaid,
    refetch: fetchTransactions
  }
}