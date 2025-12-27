"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { Clock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface SubscriptionGuardProps {
  children: ReactNode
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  // Aguardar loading de autenticação
  if (authLoading) {
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

  // Super admin tem acesso total
  if (user.role === "super_admin") {
    console.log("[SubscriptionGuard] Super admin, acesso liberado")
    return <>{children}</>
  }

  // Para centro_admin e secretario, renderizar imediatamente
  console.log("[SubscriptionGuard] Renderizando para usuário:", user.role, "centroId:", user.centroId)
  
  return <>{children}</>
}
