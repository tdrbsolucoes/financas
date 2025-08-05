#!/usr/bin/env node

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  console.error('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas no arquivo .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Função para executar SQL
async function executeSQLFile(filePath) {
  try {
    console.log(`📄 Lendo arquivo: ${filePath}`)
    const sqlContent = readFileSync(filePath, 'utf8')
    
    console.log('🔧 Executando migração...')
    
    // Tentar executar via RPC (se disponível)
    const { error: rpcError } = await supabase.rpc('exec_sql', { 
      sql_query: sqlContent 
    })
    
    if (rpcError) {
      console.log('⚠️ RPC não disponível, tentando execução direta...')
      
      // Dividir o SQL em comandos individuais
      const commands = sqlContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'))
      
      console.log(`📝 Executando ${commands.length} comandos SQL...`)
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i]
        if (command) {
          try {
            console.log(`   ${i + 1}/${commands.length}: Executando comando...`)
            // Para comandos DDL, usar uma abordagem diferente
            const { error } = await supabase.from('_temp_migration').select('1').limit(0)
            if (error && error.message.includes('does not exist')) {
              console.log('   ⚠️ Comando requer execução manual no Supabase Dashboard')
            }
          } catch (cmdError) {
            console.log(`   ⚠️ Comando ${i + 1} requer execução manual`)
          }
        }
      }
      
      console.log('\n📋 EXECUTE ESTE SQL MANUALMENTE NO SUPABASE DASHBOARD:')
      console.log('=' .repeat(80))
      console.log(sqlContent)
      console.log('=' .repeat(80))
      
      return false
    }
    
    console.log('✅ Migração executada com sucesso via RPC!')
    return true
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message)
    return false
  }
}

// Função para verificar se as colunas foram adicionadas
async function verifyColumns() {
  try {
    console.log('\n🔍 Verificando estrutura das tabelas...')
    
    // Verificar tabela contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(1)
    
    if (!contactsError) {
      console.log('✅ Tabela contacts acessível')
      if (contacts && contacts.length > 0) {
        const columns = Object.keys(contacts[0])
        console.log(`   Colunas encontradas: ${columns.join(', ')}`)
      }
    } else {
      console.log('⚠️ Erro ao acessar tabela contacts:', contactsError.message)
    }
    
    // Verificar tabela transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .limit(1)
    
    if (!transactionsError) {
      console.log('✅ Tabela transactions acessível')
      if (transactions && transactions.length > 0) {
        const columns = Object.keys(transactions[0])
        console.log(`   Colunas encontradas: ${columns.join(', ')}`)
      }
    } else {
      console.log('⚠️ Erro ao acessar tabela transactions:', transactionsError.message)
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error.message)
  }
}

// Função principal
async function updateDatabase() {
  console.log('🚀 Iniciando atualização do banco de dados...')
  console.log(`📡 Conectando ao Supabase: ${supabaseUrl}`)
  
  const migrationFile = join(__dirname, 'migrations', 'add_missing_columns.sql')
  
  const success = await executeSQLFile(migrationFile)
  
  if (success) {
    console.log('\n✅ Migração concluída com sucesso!')
  } else {
    console.log('\n⚠️ Migração requer execução manual')
    console.log('Copie o SQL acima e execute no Supabase Dashboard > SQL Editor')
  }
  
  await verifyColumns()
  
  console.log('\n🎉 Processo de atualização finalizado!')
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  updateDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Erro fatal:', error)
      process.exit(1)
    })
}

export { updateDatabase }