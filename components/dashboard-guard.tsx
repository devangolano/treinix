"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Clock } from "lucide-react"

interface DashboardGuardProps {
  children: ReactNode
}

export function DashboardGuard({ children }: DashboardGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Ainda carregando, não fazer nada
    if (isLoading) {
      console.log("[DashboardGuard] Ainda carregando autenticação")
      return
    }

    // Já redirecionou, não fazer nada
    if (hasRedirected) {
      console.log("[DashboardGuard] Já foi redirecionado")
      return
    }

    console.log("[DashboardGuard] Verificando acesso para rota:", pathname, "User:", user?.email)

    // Super admin não pode acessar dashboard de centro
    if (user?.role === "super_admin") {
      console.log("[DashboardGuard] Super admin detectado, redirecionando para /super-admin")
      setHasRedirected(true)
      router.push("/super-admin")
      return
    }

    // Usuário não autenticado
    if (!user) {
      console.log("[DashboardGuard] Usuário não autenticado, redirecionando para /login")
      setHasRedirected(true)
      router.push("/login")
      return
    }

    // Secretario e centro_admin podem acessar
    console.log("[DashboardGuard] Acesso concedido para:", user.email)
  }, [user, isLoading, router, pathname, hasRedirected])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Clock className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se foi redirecionado, não renderizar nada
  if (hasRedirected) {
    return null
  }

  // Só renderizar se há usuário autenticado e não foi redirecionado
  if (user) {
    return <>{children}</>
  }

  // Estado indeterminado - mostrar loading
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Clock className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Verificando acesso...</p>
      </div>
    </div>
  )
}
