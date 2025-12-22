import { createClient } from "@supabase/supabase-js"

// Variáveis de ambiente necessárias:
// NEXT_PUBLIC_SUPABASE_URL - URL do seu projeto Supabase
// NEXT_PUBLIC_SUPABASE_ANON_KEY - Chave anônima do Supabase

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não estão definidas"
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
