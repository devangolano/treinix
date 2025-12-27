"use client"

import type { ReactNode } from "react"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (isLoading) return

    // Não redirecionar múltiplas vezes
    if (hasRedirected.current) return

    if (!user) {
      // Usuário não autenticado - redirecionar para login
      hasRedirected.current = true
      router.replace("/login")
      return
    }

    if (user.role !== "super_admin") {
      // Usuário autenticado mas não é super_admin - redirecionar para dashboard
      hasRedirected.current = true
      router.replace("/dashboard")
      return
    }

    // Usuário é super_admin e está autenticado - permitir acesso
  }, [user, isLoading, router])

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>
  }

  return <>{children}</>
}
