"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import type { User } from "@/lib/types"
import { signIn, signOut, onAuthStateChange, getUserProfile } from "@/lib/supabase-auth"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    // Escutar mudanças no estado de autenticação do Supabase
    const unsubscribeFn = onAuthStateChange(async (authUser) => {
      if (authUser) {
        // Buscar o perfil completo do usuário
        const profile = await getUserProfile(authUser.id)
        setUser(profile)
      } else {
        setUser(null)
      }
      setIsLoading(false)
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
    const result = await signIn(email, password)
    if (result.success && result.data) {
      // Recarregar sessão para garantir que o usuário está autenticado
      // O onAuthStateChange vai ser disparado automaticamente
      return true
    } else {
      console.error(result.error)
      return false
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
