"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { centroService, subscriptionService } from "@/lib/supabase-services"
import { signOut } from "@/lib/supabase-auth"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertTriangle, Clock, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TrialExpiringDialogProps {
  daysRemaining: number
  onRenew: () => void
}

function TrialExpiringDialog({ daysRemaining, onRenew }: TrialExpiringDialogProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Verificar se já foi mostrado hoje
    const lastShownKey = "trial-dialog-last-shown"
    const lastShown = localStorage.getItem(lastShownKey)
    const today = new Date().toDateString()

    if (!lastShown || lastShown !== today) {
      setOpen(true)
      localStorage.setItem(lastShownKey, today)
    }
  }, [])

  const handleRenew = () => {
    setOpen(false)
    onRenew()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <DialogTitle>Período de Teste</DialogTitle>
          </div>
          <DialogDescription>
            Seu período de teste está terminando em breve
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm">
              <strong>Dias restantes:</strong>{" "}
              <span className="text-lg font-bold text-orange-600">{daysRemaining}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Após o encerramento do teste, você precisará de uma subscrição ativa para continuar usando a plataforma.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
          <Button onClick={handleRenew} className="bg-orange-600 hover:bg-orange-700">
            Renovar Agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface SubscriptionGuardProps {
  children: ReactNode
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading: authLoading } = useAuth()
  const [checking, setChecking] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasAccess: boolean
    status: "trial" | "active" | "expired" | "blocked"
    daysRemaining?: number
    message?: string
  } | null>(null)

  const allowedWhenBlocked = ["/dashboard/subscription", "/dashboard/blocked"]
  const isAllowedRoute = allowedWhenBlocked.some((route) => pathname.startsWith(route))

  useEffect(() => {
    if (authLoading) return

    console.log("[SubscriptionGuard] Verificando acesso para rota:", pathname)

    if (!user || !user.centroId) {
      console.log("[SubscriptionGuard] Usuário não autenticado ou sem centroId")
      router.push("/login")
      return
    }

    console.log("[SubscriptionGuard] Usuário:", user)

    // Super admin sempre tem acesso
    if (user.role === "super_admin") {
      console.log("[SubscriptionGuard] Super admin detectado, acesso liberado")
      setChecking(false)
      return
    }

    // Verificar subscrição do centro
    checkSubscription(user.centroId)
  }, [user, authLoading, router, pathname])

  const checkSubscription = async (centroId: string) => {
    try {
      // Buscar dados do centro
      const centro = await centroService.getById(centroId)
      if (!centro) {
        setSubscriptionStatus({ hasAccess: false, status: "blocked", message: "Centro não encontrado" })
        setChecking(false)
        return
      }

      console.log("[SubscriptionGuard] Centro:", centro)

      // Verificar se está em período de teste
      if (centro.subscriptionStatus === "trial" && centro.trialEndsAt) {
        const now = new Date()
        const daysRemaining = Math.ceil((centro.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysRemaining > 0) {
          console.log("[SubscriptionGuard] Período de teste ativo, dias restantes:", daysRemaining)
          setSubscriptionStatus({
            hasAccess: true,
            status: "trial",
            daysRemaining,
            message: `Período de teste - ${daysRemaining} dias restantes`,
          })
          setChecking(false)
          return
        }
      }

      // Verificar subscrição ativa
      if (centro.subscriptionStatus === "active") {
        const subscriptions = await subscriptionService.getByCentroId(centroId)
        const activeSubscription = subscriptions.find((s) => s.status === "active")

        if (activeSubscription) {
          const now = new Date()
          const daysRemaining = Math.ceil((activeSubscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          if (daysRemaining > 0) {
            console.log("[SubscriptionGuard] Subscrição ativa, dias restantes:", daysRemaining)
            setSubscriptionStatus({
              hasAccess: true,
              status: "active",
              daysRemaining,
              message: `Subscrição ativa - ${daysRemaining} dias restantes`,
            })
            setChecking(false)
            return
          }
        }
      }

      // Subscrição expirada ou bloqueada
      console.log("[SubscriptionGuard] Acesso bloqueado")
      setSubscriptionStatus({
        hasAccess: false,
        status: centro.subscriptionStatus === "blocked" ? "blocked" : "expired",
        message:
          centro.subscriptionStatus === "blocked"
            ? "Conta bloqueada. Entre em contacto com o suporte."
            : "Subscrição expirada. Renove para continuar usando a plataforma.",
      })
      setChecking(false)
    } catch (error) {
      console.error("[SubscriptionGuard] Erro ao verificar subscrição:", error)
      setSubscriptionStatus({ hasAccess: false, status: "expired" })
      setChecking(false)
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Clock className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  if (subscriptionStatus?.hasAccess || isAllowedRoute) {
    return (
      <>
        {subscriptionStatus?.status === "trial" && !isAllowedRoute && (
          <TrialExpiringDialog
            daysRemaining={subscriptionStatus.daysRemaining || 0}
            onRenew={() => router.push("/dashboard/subscription")}
          />
        )}
        {children}
      </>
    )
  }

  if (!isAllowedRoute && pathname !== "/dashboard/blocked") {
    router.push("/dashboard/blocked")
    return null
  }

  // Página de bloqueio
  return (
    <SubscriptionBlockedPage status={subscriptionStatus?.status || "expired"} message={subscriptionStatus?.message} />
  )
}

function SubscriptionBlockedPage({ status, message }: { status: string; message?: string }) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            {status === "blocked" ? (
              <Lock className="h-8 w-8 text-destructive" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-destructive" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl">Acesso Bloqueado</CardTitle>
            <CardDescription>{message || "Sua subscrição expirou"}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">Para continuar usando a plataforma:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Renove sua subscrição através do painel</li>
              <li>Entre em contacto com nosso suporte</li>
              <li>Aguarde aprovação do pagamento pendente</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button className="w-full" onClick={() => router.push("/dashboard/subscription")}>
              Renovar Subscrição
            </Button>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => (window.location.href = "mailto:suporte@formacao-ao.com")}
            >
              Contactar Suporte
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={async () => {
                await signOut()
                router.push("/login")
              }}
            >
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
