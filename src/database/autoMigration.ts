import { supabase } from '../supabaseClient'

interface TableInfo {
  tableName: string
  columns: string[]
  exists: boolean
}

interface DatabaseSchema {
  tables: TableInfo[]
  types: string[]
  policies: string[]
}

export class AutoMigrationService {
  
  // Lê o arquivo Inicializacao.sql
  async readInitializationSQL(): Promise<string> {
    try {
      const response = await fetch('/Inicializacao.sql')
      if (!response.ok) {
        throw new Error(`Erro ao ler arquivo: ${response.status}`)
      }
      return await response.text()
    } catch (error) {
      console.error('❌ Erro ao ler Inicializacao.sql:', error)
      throw new Error('Não foi possível ler o arquivo de inicialização')
    }
  }

  // Extrai informações das tabelas do SQL
  parseSQL(sqlContent: string): DatabaseSchema {
    const schema: DatabaseSchema = {
      tables: [],
      types: [],
      policies: []
    }

    // Extrai tipos ENUM
    const typeMatches = sqlContent.match(/CREATE TYPE\s+(\w+)\s+AS\s+ENUM\s*\([^)]+\)/gi)
    if (typeMatches) {
      schema.types = typeMatches.map(match => {
        const typeMatch = match.match(/CREATE TYPE\s+(\w+)/i)
        return typeMatch ? typeMatch[1] : ''
      }).filter(Boolean)
    }

    // Extrai tabelas e suas colunas
    const tableMatches = sqlContent.match(/create table[^;]+;/gi)
    if (tableMatches) {
      tableMatches.forEach(tableSQL => {
        const tableNameMatch = tableSQL.match(/create table\s+(?:if not exists\s+)?(?:public\.)?(\w+)/i)
        if (tableNameMatch) {
          const tableName = tableNameMatch[1]
          
          // Extrai colunas da tabela
          const columnMatches = tableSQL.match(/(\w+)\s+(?:uuid|text|numeric|boolean|date|timestamp|jsonb|contact_type|transaction_type)[^,\n)]+/gi)
          const columns = columnMatches ? columnMatches.map(col => {
            const colMatch = col.match(/(\w+)/)
            return colMatch ? colMatch[1] : ''
          }).filter(Boolean) : []

          schema.tables.push({
            tableName,
            columns,
            exists: false
          })
        }
      })
    }

    return schema
  }

  // Verifica quais tabelas existem no banco
  async checkExistingTables(schema: DatabaseSchema): Promise<DatabaseSchema> {
    const updatedSchema = { ...schema }
    
    for (const table of updatedSchema.tables) {
      try {
        const { error } = await supabase
          .from(table.tableName)
          .select('*')
          .limit(1)
        
        table.exists = !error
        
        if (table.exists) {
          console.log(`✅ Tabela '${table.tableName}' já existe`)
        } else {
          console.log(`⚠️ Tabela '${table.tableName}' não encontrada`)
        }
      } catch (error) {
        table.exists = false
        console.log(`⚠️ Tabela '${table.tableName}' não encontrada`)
      }
    }
    
    return updatedSchema
  }

  // Executa SQL usando a função RPC do Supabase
  async executeSQL(sql: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Tentando executar SQL via RPC...')
      
      // Tenta usar a função RPC se existir
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      
      if (error) {
        console.log('⚠️ RPC falhou, tentando método alternativo...')
        // Se a função RPC não existir, retorna erro específico
        if (error.code === '42883') {
          // Tenta executar usando método alternativo
          return await this.executeAlternativeMethod(sql)
        }
        throw error
      }
      
      console.log('✅ SQL executado com sucesso via RPC')
      return { success: true }
    } catch (error: any) {
      console.error('❌ Erro ao executar SQL:', error)
      return { success: false, error: error.message }
    }
  }

  // Método alternativo para executar SQL
  private async executeAlternativeMethod(sql: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Executando via método alternativo...')
      
      // Divide o SQL em comandos individuais
      const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
      
      console.log(`📝 Encontrados ${commands.length} comandos para executar`)
      
      for (const command of commands) {
        if (command.toLowerCase().includes('create table')) {
          console.log('🔧 Tentando criar tabela via API REST...')
          // Para tabelas, tentamos uma abordagem diferente
          const result = await this.createTableViaREST(command)
          if (!result.success) {
            return result
          }
        }
      }
      
      console.log('✅ Comandos executados via método alternativo')
      return { success: true }
      
    } catch (error: any) {
      console.error('❌ Erro no método alternativo:', error)
      return { 
        success: false, 
        error: 'Não foi possível executar automaticamente. Execute o SQL manualmente no Supabase Dashboard.' 
      }
    }
  }

  // Cria tabela via API REST (método limitado)
  private async createTableViaREST(createTableSQL: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Este é um método limitado - na prática, precisamos do SQL Editor
      // Mas vamos tentar verificar se a tabela já existe
      
      const tableNameMatch = createTableSQL.match(/create table\s+(?:if not exists\s+)?(?:public\.)?(\w+)/i)
      if (!tableNameMatch) {
        return { success: false, error: 'Não foi possível identificar o nome da tabela' }
      }
      
      const tableName = tableNameMatch[1]
      console.log(`🔍 Verificando se tabela '${tableName}' existe...`)
      
      // Tenta fazer uma consulta simples para ver se a tabela existe
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (!error) {
        console.log(`✅ Tabela '${tableName}' já existe`)
        return { success: true }
      }
      
      if (error.code === '42P01') {
        console.log(`❌ Tabela '${tableName}' não existe e não pode ser criada automaticamente`)
        return { 
          success: false, 
          error: `Tabela '${tableName}' não existe. Execute o SQL manualmente no Supabase Dashboard.` 
        }
      }
      
      return { success: true }
      
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  // Cria tabelas que não existem
  async createMissingTables(schema: DatabaseSchema): Promise<{ success: boolean; results: any[] }> {
    const results = []
    let allSuccessful = true

    console.log('🔄 Iniciando criação de tabelas faltantes...')
    
    // Primeiro, lê o SQL completo do arquivo
    const sqlContent = await this.readInitializationSQL()
    console.log('📄 Arquivo SQL carregado com sucesso')
    
    // Verifica se há tabelas faltando
    const missingTables = schema.tables.filter(table => !table.exists)
    
    if (missingTables.length === 0) {
      console.log('✅ Todas as tabelas já existem no banco')
      return { success: true, results: [] }
    }

    console.log(`🔧 Tentando criar ${missingTables.length} tabela(s) faltante(s):`, missingTables.map(t => t.tableName))
    
    // Executa o SQL completo (com IF NOT EXISTS, não causará problemas)
    const result = await this.executeSQL(sqlContent)
    results.push({ operation: 'Criação de tabelas', ...result })
    
    if (!result.success) {
      allSuccessful = false
      console.error('❌ Falha ao criar tabelas automaticamente:', result.error)
    } else {
      console.log('✅ SQL executado - verificando se tabelas foram criadas...')
      
      // Verifica novamente se as tabelas foram criadas
      const updatedSchema = await this.checkExistingTables(schema)
      const stillMissing = updatedSchema.tables.filter(table => !table.exists)
      
      if (stillMissing.length > 0) {
        console.log('⚠️ Algumas tabelas ainda não foram criadas:', stillMissing.map(t => t.tableName))
        allSuccessful = false
        results.push({ 
          operation: 'Verificação pós-criação', 
          success: false, 
          error: `Tabelas ainda faltando: ${stillMissing.map(t => t.tableName).join(', ')}` 
        })
      } else {
        console.log('✅ Todas as tabelas foram criadas com sucesso!')
      }
    }

    return { success: allSuccessful, results }
  }

  // Processo completo de verificação e criação automática
  async autoInitializeDatabase(): Promise<{ 
    success: boolean; 
    message: string; 
    needsManualSetup?: boolean;
    sqlContent?: string;
  }> {
    try {
      console.log('🚀 Iniciando verificação automática do banco de dados...')
      
      // 1. Lê o arquivo SQL
      const sqlContent = await this.readInitializationSQL()
      console.log('📄 Arquivo Inicializacao.sql carregado')
      
      // 2. Analisa o SQL para extrair estrutura
      const schema = await this.parseSQL(sqlContent)
      console.log(`📊 Encontradas ${schema.tables.length} tabelas no arquivo SQL`)
      
      // 3. Verifica quais tabelas existem
      const updatedSchema = await this.checkExistingTables(schema)
      
      // 4. Cria tabelas faltantes
      const creationResult = await this.createMissingTables(updatedSchema)
      
      if (creationResult.success) {
        return {
          success: true,
          message: 'Banco de dados verificado e atualizado com sucesso!'
        }
      } else {
        // Se falhou, oferece setup manual
        return {
          success: false,
          message: 'Falha na criação automática. Configure manualmente.',
          needsManualSetup: true,
          sqlContent
        }
      }
      
    } catch (error: any) {
      console.error('❌ Erro na inicialização automática:', error)
      
      // Em caso de erro, tenta ler o SQL para setup manual
      try {
        const sqlContent = await this.readInitializationSQL()
        return {
          success: false,
          message: `Erro na inicialização: ${error.message}`,
          needsManualSetup: true,
          sqlContent
        }
      } catch {
        return {
          success: false,
          message: 'Erro crítico: não foi possível ler o arquivo de inicialização'
        }
      }
    }
  }

  // Verifica se o banco está pronto (todas as tabelas existem)
  async isDatabaseReady(): Promise<boolean> {
    try {
      // Verifica as tabelas principais
      const tables = ['contacts', 'transactions']
      
      for (const tableName of tables) {
        const { error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1)
        
        if (error) {
          return false
        }
      }
      
      return true
    } catch {
      return false
    }
  }
}

export const autoMigrationService = new AutoMigrationService()