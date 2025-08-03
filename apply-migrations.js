// apply-migrations.js

const fs = require('fs');
const path = require('path');
const postgres = require('postgres');
require('dotenv').config();

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Erro: A variável de ambiente DATABASE_URL não está definida.');
    console.error('Por favor, adicione-a ao seu arquivo .env com a connection string do seu banco Supabase.');
    process.exit(1);
  }

  // Conecta ao banco de dados com SSL
  const sql = postgres(connectionString, {
    ssl: 'require'
  });

  console.log('🚀 Conectado ao banco de dados. Verificando migrações...');

  try {
    // 1. Garante que a tabela de controle de migrações exista
    await sql`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Tabela de controle de migrações (schema_migrations) verificada/criada.');

    // 2. Busca as migrações já aplicadas
    const appliedMigrations = await sql`SELECT version FROM public.schema_migrations`;
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));
    console.log(`🔍 Migrações já aplicadas: ${appliedVersions.size > 0 ? [...appliedVersions].join(', ') : 'Nenhuma'}`);

    // 3. Lê os arquivos de migração do diretório, em ordem alfabética
    if (!fs.existsSync(MIGRATIONS_DIR)) {
        console.log("🟡 Diretório 'migrations' não encontrado. Nenhuma migração para aplicar.");
        await sql.end();
        return;
    }

    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('🟡 Nenhum arquivo .sql encontrado no diretório "migrations".');
      await sql.end();
      return;
    }

    // 4. Aplica as migrações pendentes
    let migrationsAppliedCount = 0;
    for (const file of migrationFiles) {
      if (!appliedVersions.has(file)) {
        console.log(`⚡ Aplicando migração: ${file}...`);
        const migrationSql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');

        // Executa a migração e a inserção na tabela de controle dentro de uma transação
        await sql.begin(async transaction => {
          await transaction.unsafe(migrationSql);
          await transaction`INSERT INTO public.schema_migrations (version) VALUES (${file})`;
        });

        console.log(`✔️ Migração ${file} aplicada com sucesso.`);
        migrationsAppliedCount++;
      }
    }

    if (migrationsAppliedCount === 0) {
      console.log('✨ Banco de dados já está atualizado.');
    } else {
      console.log(`🎉 Total de ${migrationsAppliedCount} nova(s) migração(ões) aplicada(s).`);
    }

  } catch (error) {
    if (error.code === '28P01') {
      console.error('❌ Erro de autenticação: A senha do banco de dados está incorreta.');
      console.error('Verifique o valor de DATABASE_URL no seu arquivo .env e tente novamente.');
      process.exit(1);
    } else if (error.code === 'ENOTFOUND') {
      console.error('❌ Erro de conexão: Não foi possível encontrar o host do banco de dados.');
      console.error('Verifique se a DATABASE_URL em seu arquivo .env está correta e completa.');
      console.error('Exemplo: postgresql://postgres:[SUA_SENHA]@db.xxxxxxxx.supabase.co:5432/postgres');
      process.exit(1);
    } else {
      console.error('❌ Ocorreu um erro fatal durante a migração:', error);
      process.exit(1);
    }
  } finally {
    await sql.end();
    console.log('🔌 Conexão com o banco de dados fechada.');
  }
}

runMigrations().catch(err => {
  console.error('❌ Erro inesperado ao executar o script de migração:', err);
  process.exit(1);
});