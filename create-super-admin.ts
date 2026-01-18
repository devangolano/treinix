import { createClient } from "@supabase/supabase-js"

// Configurar cliente Supabase com service role key (apenas para admin)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Erro: Variáveis de ambiente não configuradas!")
  console.error("   Adicione NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createSuperAdmin() {
  try {
    console.log("🔐 Criando Super Admin no Supabase Auth...")

    // 1. Deletar usuário anterior se existir
    console.log("   → Limpando usuário anterior...")
    try {
      await supabase.auth.admin.deleteUser("admin@formacao-ao.com")
    } catch {
      // Ignorar erro se não existir
    }

    // 2. Criar usuário no Supabase Auth
    console.log("   → Criando usuário em auth.users...")
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@formacao-ao.com",
      password: "admin123",
      email_confirm: true, // Confirmar email automaticamente
    })

    if (authError || !authUser?.user) {
      console.error("❌ Erro ao criar usuário no Auth:", authError?.message)
      process.exit(1)
    }

    console.log("   ✅ Usuário criado no Auth:", authUser.user.id)

    // 3. Deletar usuário antigo da tabela users se existir
    console.log("   → Deletando registro antigo de users...")
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("email", "admin@formacao-ao.com")

    if (deleteError && !deleteError.message.includes("no rows")) {
      console.warn("   ⚠️  Aviso ao deletar:", deleteError.message)
    }

    // 4. Criar registro na tabela users com auth_user_id
    console.log("   → Criando registro na tabela users...")
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert([
        {
          name: "Super Admin",
          email: "admin@formacao-ao.com",
          phone: "+244 923 456 789",
          role: "super_admin",
          password_hash: "", // Não usar, pois está no Supabase Auth
        },
      ])
      .select()
      .single()

    if (userError || !newUser) {
      console.error("❌ Erro ao criar registro em users:", userError?.message)
      process.exit(1)
    }

    console.log("   ✅ Registro criado em users:", newUser.id)

    console.log("\n✅ Super Admin criado com sucesso!")
    console.log("\n📝 Credenciais para login:")
    console.log("   Email: admin@formacao-ao.com")
    console.log("   Senha: admin123")
    console.log("\n⚠️  IMPORTANTE: Mude essa senha após o primeiro login!")
  } catch (error) {
    console.error("❌ Erro geral:", error)
    process.exit(1)
  }
}

createSuperAdmin()
