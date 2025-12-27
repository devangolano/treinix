"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Clock } from "lucide-react"
import { safeNavigate } from "@/lib/navigation-utils"

interface DashboardGuardProps {
  children: React.ReactNode
}

export function DashboardGuard({ children }: DashboardGuardProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const hasCheckedAuth = useRef(false)
  const [localInitializing, setLocalInitializing] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    // Registrar que iniciamos a verificação
    console.log("DashboardGuard: Iniciando, user:", user?.id, "isLoading:", isLoading)
    
    // Se o usuário já está setado (login bem-sucedido), prosseguir imediatamente
    if (user) {
      console.log("DashboardGuard: Usuário já setado, processando...")
      
      // Evitar múltiplas verificações
      if (hasCheckedAuth.current) {
        return
      }
      hasCheckedAuth.current = true

      // Super admin não pode acessar dashboard de centro
      if (user.role === "super_admin") {
        console.log("DashboardGuard: Usuário é super_admin, redirecionando para /super-admin")
        startTransition(() => {
          safeNavigate(router, "/super-admin", { fallbackDelay: 1500 })
        })
        return
      }

      // centro_admin e secretario podem acessar
      console.log("DashboardGuard: Usuário autorizado -", user.role)
      setLocalInitializing(false)
      return
    }

    // Se ainda está loading, aguardar
    if (isLoading) {
      console.log("DashboardGuard: Aguardando carregamento de auth...")
      return
    }

    // Usuário não autenticado e não está mais loading
    if (!user && !isLoading) {
      if (hasCheckedAuth.current) {
        return
      }
      hasCheckedAuth.current = true
      
      console.log("DashboardGuard: Usuário não autenticado, redirecionando para /login")
      startTransition(() => {
        safeNavigate(router, "/login", { fallbackDelay: 1500 })
      })
      return
    }
  }, [user, isLoading, router])

  // Mostrar loading apenas se ainda estamos inicializando
  if (localInitializing || (!user && isLoading) || isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Clock className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Se não tem usuário, não renderizar
  if (!user) {
    return null
  }

  return <>{children}</>
}
