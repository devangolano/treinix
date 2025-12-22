#!/usr/bin/env node

/**
 * Script de teste para diagnosticar problemas de login
 * 
 * Como usar:
 * 1. npm install (já feito)
 * 2. Crie um arquivo .env.test com:
 *    NEXT_PUBLIC_SUPABASE_URL=sua-url
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave
 * 3. node test-login.js
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(color, ...args) {
  console.log(`${color}${args.join(' ')}${colors.reset}`)
}

async function main() {
  log(colors.bright + colors.blue, '\n🔍 TESTE DE LOGIN SUPABASE\n')

  // Passo 1: Verificar arquivo .env.local
  log(colors.blue, '📝 Passo 1: Verificando arquivo .env.local...')
  
  const envPath = path.resolve('.env.local')
  if (!fs.existsSync(envPath)) {
    log(colors.red, '❌ Arquivo .env.local não encontrado!')
    log(colors.yellow, '   Crie o arquivo com:')
    log(colors.yellow, '   NEXT_PUBLIC_SUPABASE_URL=sua-url')
    log(colors.yellow, '   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave')
    process.exit(1)
  }
  log(colors.green, '✅ Arquivo .env.local encontrado')

  // Passo 2: Carregar variáveis
  log(colors.blue, '\n📝 Passo 2: Carregando variáveis de ambiente...')
  
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim()
  const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim()

  if (!supabaseUrl || !supabaseAnonKey) {
    log(colors.red, '❌ Variáveis de ambiente incompletas!')
    log(colors.yellow, '   Verifique .env.local')
    process.exit(1)
  }

  log(colors.green, `✅ URL: ${supabaseUrl.substring(0, 30)}...`)
  log(colors.green, `✅ Chave: ${supabaseAnonKey.substring(0, 20)}...`)

  // Passo 3: Criar cliente Supabase
  log(colors.blue, '\n📝 Passo 3: Criando cliente Supabase...')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  log(colors.green, '✅ Cliente criado')

  // Passo 4: Testar conexão
  log(colors.blue, '\n📝 Passo 4: Testando conexão com o banco...')
  
  try {
    const { data, error } = await supabase.from('centros').select('count(*)', { count: 'exact' }).limit(1)
    
    if (error) {
      log(colors.red, `❌ Erro ao conectar: ${error.message}`)
      log(colors.yellow, '   Verifique se o schema foi executado em supabase/schema.sql')
      process.exit(1)
    }
    
    log(colors.green, '✅ Conexão OK')
  } catch (err) {
    log(colors.red, `❌ Erro: ${err.message}`)
    process.exit(1)
  }

  // Passo 5: Listar usuários
  log(colors.blue, '\n📝 Passo 5: Verificando usuários registrados...')
  
  try {
    // Nota: Isso só funciona se tiver permissão (admin)
    // Para desenvolvimento, vamos apenas tentar fazer login com um teste
    log(colors.yellow, '   (Pulando listagem de usuários)')
  } catch (err) {
    log(colors.yellow, '   (Sem permissão para listar usuários)')
  }

  // Passo 6: Dicas de resolução
  log(colors.blue, '\n📝 Passo 6: Dicas para resolver o erro...')
  log(colors.yellow, '')
  log(colors.yellow, '1️⃣  DESABILITAR CONFIRMAÇÃO DE EMAIL:')
  log(colors.yellow, '    - Supabase Dashboard → Authentication → Email')
  log(colors.yellow, '    - Desmarque "Confirm email"')
  log(colors.yellow, '')
  log(colors.yellow, '2️⃣  CONFIRMAR EMAIL EXISTENTE:')
  log(colors.yellow, '    - Authentication → Users')
  log(colors.yellow, '    - Clique no usuário e marque como "Confirmed"')
  log(colors.yellow, '')
  log(colors.yellow, '3️⃣  CRIAR CONTA NOVA:')
  log(colors.yellow, '    - Acesse http://localhost:3000/register')
  log(colors.yellow, '    - Crie uma nova conta')
  log(colors.yellow, '')
  log(colors.yellow, '4️⃣  REINICIAR SERVIDOR:')
  log(colors.yellow, '    - Depois de editar .env.local, reinicie com npm run dev')
  log(colors.yellow, '')

  // Conclusão
  log(colors.bright + colors.green, '\n✅ Teste completado!\n')
  log(colors.bright + colors.green, 'A conexão com Supabase está funcionando.')
  log(colors.bright + colors.green, 'Se o login ainda não funciona, siga as dicas acima.\n')
}

main().catch((err) => {
  log(colors.red, `\n❌ Erro fatal: ${err.message}\n`)
  process.exit(1)
})
