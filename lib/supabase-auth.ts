import { supabase } from "./supabase"
import type { User } from "./types"

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
    // Buscar o usuário autenticado atual do Supabase
    const { data } = await supabase.auth.getUser()
    
    if (!data?.user) {
      return null
    }

    // Tentar buscar os dados do usuário na tabela users
    let userRole = "centro_admin"
    let centroId: string | undefined
    let userName = data.user.user_metadata?.name || data.user.email || "Usuário"

    try {
      // Buscar na tabela users pelo auth_user_id
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", data.user.id)
        .single()

      if (userData) {
        userRole = userData.role || "centro_admin"
        centroId = userData.centro_id
        userName = userData.name || userName
      }
    } catch (error: any) {
      // PGRST116 = Nenhuma linha encontrada (usuário não está na tabela users, pode ser admin que se registrou)
      if (error?.code !== "PGRST116") {
        console.error("Erro ao buscar dados do usuário na tabela users:", error)
      }
      
      // Se não encontrar na tabela users, tentar buscar centroId por email
      if (!centroId && data.user.email) {
        try {
          const { data: centroData, error: centroError } = await supabase
            .from("centros")
            .select("id")
            .eq("email", data.user.email)
            .single()

          if (centroData?.id) {
            centroId = centroData.id
          }
        } catch (centroErrorInner: any) {
          // Se não encontrar centro também, log apenas se não for erro de "not found"
          if (centroErrorInner?.code !== "PGRST116") {
            console.error("Erro ao buscar centroId:", centroErrorInner)
          }
        }
      }
    }

    // Guardar centroId no localStorage para próximas vezes
    if (centroId) {
      localStorage.setItem(`centro_${data.user.id}`, centroId)
    }

    // Retornar dados do auth com dados da tabela users
    return {
      id: data.user.id,
      name: userName,
      email: data.user.email || "",
      role: userRole as any,
      centroId: centroId,
      createdAt: new Date(data.user.created_at),
      updatedAt: new Date(data.user.updated_at || data.user.created_at),
    }
  } catch (error) {
    console.error("Erro ao obter perfil do usuário:", error)
    return null
  }
}
