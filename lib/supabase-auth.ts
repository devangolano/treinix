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

    if (error) throw error

    return {
      success: true,
      data: data.user,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao registrar",
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

    // Tentar buscar o centroId associado a este email
    let centroId: string | undefined

    // Primeiro, tentar buscar no localStorage
    centroId = localStorage.getItem(`centro_${data.user.id}`) || undefined

    // Se não encontrar no localStorage, buscar na tabela centros
    if (!centroId && data.user.email) {
      try {
        const { data: centroData } = await supabase
          .from("centros")
          .select("id")
          .eq("email", data.user.email)
          .single()

        if (centroData?.id) {
          centroId = centroData.id
          // Guardar no localStorage para próximas vezes
          if (centroId) {
            localStorage.setItem(`centro_${data.user.id}`, centroId)
          }
        }
      } catch (error) {
        console.error("Erro ao buscar centroId:", error)
        // Continuar sem centroId
      }
    }

    // Retornar dados do auth com centroId
    return {
      id: data.user.id,
      name: data.user.user_metadata?.name || data.user.email || "Usuário",
      email: data.user.email || "",
      role: "centro_admin",
      centroId: centroId,
      createdAt: new Date(data.user.created_at),
      updatedAt: new Date(data.user.updated_at || data.user.created_at),
    }
  } catch (error) {
    console.error("Erro ao obter perfil do usuário:", error)
    return null
  }
}
