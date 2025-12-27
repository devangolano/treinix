"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Clock } from "lucide-react"

interface DashboardGuardProps {
  children: React.ReactNode
}

/**
 * DashboardGuard - Apenas validação local, NÃO faz redirecionamento
 * 
 * A proteção de rotas é feita no middleware.ts (server-side)
 * Este componente apenas:
 * 1. Aguarda carregamento de auth
 * 2. Valida que usuário não é super_admin
 * 3. Renderiza children
 * 
 * IMPORTANTE: Redirecionamentos são feitos no middleware, NÃO aqui
 */
export function DashboardGuard({ children }: DashboardGuardProps) {
  const { user, isLoading } = useAuth()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    console.log("[DashboardGuard] Estado atual - user:", user?.id, "isLoading:", isLoading)
    
    // Aguardar carregamento de autenticação
    if (isLoading) {
      console.log("[DashboardGuard] Aguardando carregamento de auth...")
      return
    }

    // Se não tem usuário, middleware já redirecionou para login
    // Apenas registrar para debugging
    if (!user) {
      console.log("[DashboardGuard] Sem usuário (middleware deveria ter redirecionado)")
      return
    }

    // Se é super_admin, NÃO renderizar aqui
    // Nota: middleware deveria ter redirecionado, mas fazemos validação extra
    if (user.role === "super_admin") {
      console.log("[DashboardGuard] Super admin detectado - NÃO renderizando", user.role)
      return
    }

    console.log("[DashboardGuard] Pronto para renderizar -", user.role)
    setIsReady(true)
  }, [user, isLoading])

  // Mostrar loading enquanto carregando
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Clock className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando autenticação...</p>
        </div>
      </div>
    )
  }

  // Mostrar loading se não está pronto
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Clock className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Renderizar conteúdo
  return <>{children}</>
}
