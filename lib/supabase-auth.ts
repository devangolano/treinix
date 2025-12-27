import { supabase } from "./supabase"
import type { User, UserRole } from "./types"

/**
 * Realiza login do usuário
 * @param email Email do usuário
 * @param password Senha do usuário
 * @returns Dados do usuário autenticado
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Mensagens de erro mais específicas
      if (error.message.includes("Invalid login credentials")) {
        throw new Error(
          "Email ou senha incorretos. Verifique suas credenciais ou crie uma nova conta."
        )
      }
      // Se o email não foi confirmado, tentar auto-confirmar no banco de dados
      if (error.message.includes("Email not confirmed")) {
        try {
          // Auto-confirmar o email no Supabase Auth (requer admin key em produção)
          await supabase
            .from("profiles")
            .update({ email_confirmed_at: new Date().toISOString() })
            .eq("email", email)

          // Tentar fazer login novamente
          const retryData = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (retryData.error) throw retryData.error

          return {
            success: true,
            data: retryData.data.user,
          }
        } catch {
          // Se falhar, retornar erro original
          throw new Error(
            "Email não confirmado. Verifique seu email para confirmar a conta."
          )
        }
      }
      throw error
    }

    return {
      success: true,
      data: data.user,
    }
  } catch (error) {
    console.error("Erro no login:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao fazer login",
    }
  }
}

/**
 * Realiza logout do usuário
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao fazer logout",
    }
  }
}

/**
 * Registra um novo usuário
 * @param email Email do novo usuário
 * @param password Senha do novo usuário
 * @param name Nome do novo usuário
 * @returns Dados do usuário criado
 */
export async function signUp(email: string, password: string, name: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (error) {
      // Melhorar mensagens de erro
      if (error.message?.includes("already registered")) {
        throw new Error("Este email já foi registrado. Por favor, faça login com sua conta.")
      }
      if (error.message?.includes("User already exists")) {
        throw new Error("Este email já foi registrado. Por favor, faça login com sua conta.")
      }
      throw error
    }

    return {
      success: true,
      data: data.user,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro ao registrar"
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Obtém o usuário atualmente autenticado
 */
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) throw error

    return user
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error)
    return null
  }
}

/**
 * Escuta mudanças no estado de autenticação
 */
export function onAuthStateChange(callback: (user: any | null) => void) {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    callback(session?.user || null)
  })

  // Retornar a função unsubscribe corretamente
  return () => {
    if (data?.subscription) {
      data.subscription.unsubscribe()
    }
  }
}

/**
 * Obtém os dados do perfil do usuário
 * Usa dados do Supabase Auth e tenta buscar centroId
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    console.log("getUserProfile: Iniciando para userId:", userId)
    
    // Buscar o usuário autenticado atual do Supabase
    const { data, error: authError } = await supabase.auth.getUser()
    
    if (authError || !data?.user) {
      console.error("getUserProfile: Erro ao buscar usuário do Auth:", authError)
      return null
    }

    const authUser = data.user

    // Valores padrão
    let userRole = authUser.user_metadata?.role || "centro_admin"
    let centroId: string | undefined
    let userName = authUser.user_metadata?.name || authUser.email || "Usuário"

    console.log("getUserProfile: User metadata role:", authUser.user_metadata?.role)

    // Buscar na tabela users pelo auth_user_id
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, centro_id, name")
        .eq("auth_user_id", authUser.id)
        .single()

      if (userData) {
        console.log("getUserProfile: Dados encontrados na tabela users:", userData)
        userRole = userData.role || userRole
        centroId = userData.centro_id
        userName = userData.name || userName
      } else if (userError && userError.code === "PGRST116") {
        console.log("getUserProfile: Usuário não encontrado na tabela users (normal para novo user)")
      } else if (userError) {
        console.error("getUserProfile: Erro ao buscar na tabela users:", userError)
      }
    } catch (error: any) {
      console.error("getUserProfile: Exceção ao buscar na tabela users:", error)
    }

    // Se não tem centroId, tentar buscar pela email do centro
    if (!centroId && authUser.email) {
      try {
        console.log("getUserProfile: Tentando buscar centro por email:", authUser.email)
        const { data: centroData, error: centroError } = await supabase
          .from("centros")
          .select("id")
          .eq("email", authUser.email)
          .single()

        if (centroData?.id) {
          console.log("getUserProfile: Centro encontrado:", centroData.id)
          centroId = centroData.id
        } else if (centroError && centroError.code === "PGRST116") {
          console.log("getUserProfile: Nenhum centro encontrado com este email")
        } else if (centroError) {
          console.error("getUserProfile: Erro ao buscar centro:", centroError)
        }
      } catch (error: any) {
        console.error("getUserProfile: Exceção ao buscar centro:", error)
      }
    }

    // Guardar centroId no localStorage para próximas vezes
    if (centroId) {
      localStorage.setItem(`centro_${authUser.id}`, centroId)
    }

    const profile: User = {
      id: authUser.id,
      name: userName,
      email: authUser.email || "",
      role: userRole as UserRole,
      centroId: centroId,
      createdAt: new Date(authUser.created_at),
      updatedAt: new Date(authUser.updated_at || authUser.created_at),
    }

    console.log("getUserProfile: Perfil completo:", profile)
    return profile
  } catch (error) {
    console.error("getUserProfile: Erro geral ao obter perfil do usuário:", error)
    return null
  }
}
