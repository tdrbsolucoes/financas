#!/usr/bin/env node

import { setupDatabase } from './databaseSetup.js'

console.log('🚀 Iniciando configuração do banco de dados...')

setupDatabase()
  .then((success) => {
    if (success) {
      console.log('✅ Configuração concluída com sucesso!')
      process.exit(0)
    } else {
      console.log('❌ Falha na configuração')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('❌ Erro:', error)
    process.exit(1)
  })