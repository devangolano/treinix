"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Clock } from "lucide-react"

interface DashboardGuardProps {
  children: React.ReactNode
}

export function DashboardGuard({ children }: DashboardGuardProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const hasCheckedAuth = useRef(false)

  useEffect(() => {
    // Esperar até que o loading inicial termine
    if (isLoading) {
      console.log("DashboardGuard: Aguardando verificação de autenticação...")
      return
    }

    // Se já foi verificado, não fazer novamente
    if (hasCheckedAuth.current) {
      return
    }

    hasCheckedAuth.current = true

    // Super admin não pode acessar dashboard de centro
    if (user?.role === "super_admin") {
      console.log("DashboardGuard: Usuário é super_admin, redirecionando para /super-admin")
      router.replace("/super-admin")
      return
    }

    // Usuário não autenticado
    if (!user) {
      console.log("DashboardGuard: Usuário não autenticado, redirecionando para /login")
      router.replace("/login")
      return
    }

    // Secretario e centro_admin podem acessar
    console.log("DashboardGuard: Usuário autorizado -", user.role)
  }, [user, isLoading, router])

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Clock className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Se não está loading mas não tem usuário, não renderizar
  if (!user) {
    return null
  }

  return <>{children}</>
}
