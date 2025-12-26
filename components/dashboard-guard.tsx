"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Clock } from "lucide-react"

interface DashboardGuardProps {
  children: ReactNode
}

export function DashboardGuard({ children }: DashboardGuardProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    // Super admin não pode acessar dashboard de centro
    if (user?.role === "super_admin") {
      router.push("/super-admin")
      return
    }

    // Usuário não autenticado
    if (!user) {
      router.push("/login")
      return
    }

    // Secretario e centro_admin podem acessar
  }, [user, isLoading, router])

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

  return <>{children}</>
}
