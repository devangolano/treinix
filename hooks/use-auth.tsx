"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import type { User } from "@/lib/types"
import { signIn, signOut, onAuthStateChange, getUserProfile } from "@/lib/supabase-auth"
import { useRouter } from "next/navigation"

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
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    // Escutar mudanças no estado de autenticação do Supabase
    const unsubscribeFn = onAuthStateChange(async (authUser) => {
      try {
        if (authUser) {
          // Buscar o perfil completo do usuário
          const profile = await getUserProfile(authUser.id)
          if (profile) {
            console.log("AuthStateChange: Usuário autenticado -", profile.id, profile.role)
            setUser(profile)
          } else {
            console.warn("AuthStateChange: Perfil não encontrado para", authUser.id)
            setUser(null)
          }
        } else {
          console.log("AuthStateChange: Usuário não autenticado")
          setUser(null)
        }
      } catch (error) {
        console.error("Erro ao processar auth state change:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
        setInitialAuthCheckDone(true)
      }
    })

    // Armazenar a função unsubscribe
    if (typeof unsubscribeFn === "function") {
      unsubscribe = unsubscribeFn
    }

    return () => {
      // Desinscrever quando o componente desmontar
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log("Iniciando login para:", email)
      setIsLoading(true)
      
      // Fazer login com timeout de 30 segundos
      const signInPromise = signIn(email, password)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Login timeout após 30 segundos")), 30000)
      )
      
      const result = await Promise.race([signInPromise, timeoutPromise]) as any
      
      if (result.success && result.data) {
        console.log("signIn retornou sucesso para:", email)
        
        // Buscar o perfil do usuário com timeout de 15 segundos
        const profilePromise = getUserProfile(result.data.id)
        const profileTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("getUserProfile timeout após 15 segundos")), 15000)
        )
        
        const profile = await Promise.race([profilePromise, profileTimeoutPromise]) as User | null
        
        if (profile) {
          console.log("Perfil do usuário carregado:", profile.id, profile.role)
          // Atualizar o estado do usuário e parar de carregar
          setUser(profile)
          setInitialAuthCheckDone(true)
          setIsLoading(false)
          return { success: true, user: profile }
        }
        console.error("Falha ao carregar perfil do usuário - profile é null")
        setIsLoading(false)
        return { success: false }
      } else {
        console.error("Erro no login:", result?.error)
        setIsLoading(false)
        return { success: false }
      }
    } catch (error) {
      console.error("Erro na autenticação:", error)
      setIsLoading(false)
      return { success: false }
    }
  }

  const logout = async () => {
    await signOut()
    setUser(null)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
