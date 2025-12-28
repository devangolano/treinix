"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import type { User } from "@/lib/types"
import { signIn, signOut, onAuthStateChange, getUserProfile } from "@/lib/supabase-auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    let isMounted = true
    let initTimer: NodeJS.Timeout

    // Timeout para evitar loading infinito (máximo 10 segundos)
    initTimer = setTimeout(() => {
      if (isMounted && isLoading && !initialized) {
        console.warn("[AuthProvider] Timeout na inicialização da autenticação após 10s")
        setIsLoading(false)
        setInitialized(true)
      }
    }, 10000)

    // Inicializar listeners de autenticação
    const unsubscribeFn = onAuthStateChange(async (authUser) => {
      if (!isMounted) return

      try {
        if (authUser) {
          console.log("[AuthProvider] Usuário autenticado detectado:", authUser.email)
          // Buscar o perfil completo do usuário
          const profile = await getUserProfile(authUser.id)
          if (isMounted) {
            setUser(profile)
          }
        } else {
          console.log("[AuthProvider] Nenhum usuário autenticado")
          if (isMounted) {
            setUser(null)
          }
        }
      } catch (error) {
        console.error("[AuthProvider] Erro ao carregar perfil do usuário:", error)
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
          setInitialized(true)
        }
        // Limpar timeout se a inicialização completou
        clearTimeout(initTimer)
      }
    })

    // Armazenar a função unsubscribe
    if (typeof unsubscribeFn === "function") {
      unsubscribe = unsubscribeFn
    }

    return () => {
      isMounted = false
      clearTimeout(initTimer)
      // Desinscrever quando o componente desmontar
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await signIn(email, password)
      if (result.success && result.data) {
        console.log("[AuthProvider] Login bem-sucedido para:", email)
        // Buscar o perfil do usuário imediatamente após o login bem-sucedido
        const profile = await getUserProfile(result.data.id)
        if (profile) {
          setUser(profile)
          return { success: true, user: profile }
        }
        return { success: false }
      } else {
        console.error("[AuthProvider] Erro no login:", result.error)
        return { success: false }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      console.log("[AuthProvider] Realizando logout")
      await signOut()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
