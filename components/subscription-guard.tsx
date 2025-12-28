"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { centroService, subscriptionService } from "@/lib/supabase-services"
import { signOut } from "@/lib/supabase-auth"
import { useAuth } from "@/hooks/use-auth"
import { useSubscriptionRefresh } from "@/hooks/use-subscription-refresh"
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
      <DialogContent className="sm:max-w-md bg-blue-900 border-blue-700 shadow-2xl">
        <DialogHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-2xl text-white">Período de Teste</DialogTitle>
            <DialogDescription className="text-blue-100">
              Seu período de teste está terminando em breve
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-6">
          <div className="p-6 bg-white/10 rounded-xl border border-blue-600/30 backdrop-blur-sm">
            <div className="text-center space-y-2">
              <p className="text-blue-100 text-sm font-medium">Dias restantes</p>
              <p className="text-5xl font-bold text-orange-500">{daysRemaining}</p>
            </div>
          </div>
          
          <div className="bg-blue-700/40 rounded-lg p-4 border border-blue-600/30">
            <p className="text-sm text-blue-100 text-center">
              Após o encerramento do teste, você precisará de uma subscrição ativa para continuar usando a plataforma.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="flex-1 bg-blue-800/50 border-blue-600 text-white hover:bg-blue-700/70 hover:text-white"
          >
            Fechar
          </Button>
          <Button 
            onClick={handleRenew} 
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-lg"
          >
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
  const { onRefreshTriggered } = useSubscriptionRefresh()
  const [checking, setChecking] = useState(true)
  const [hasRedirected, setHasRedirected] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasAccess: boolean
    status: "trial" | "active" | "expired" | "blocked"
    daysRemaining?: number
    message?: string
  } | null>(null)

  // Quando bloqueado, APENAS allow a página de bloqueio
  const allowedWhenBlocked = ["/dashboard/blocked"]
  const isBlockedRoute = allowedWhenBlocked.some((route) => pathname === route)

  useEffect(() => {
    if (authLoading) {
      console.log("[SubscriptionGuard] Ainda carregando autenticação")
      return
    }

    console.log("[SubscriptionGuard] Verificando subscrição para:", pathname)

    // Sem usuário = não fazer nada (DashboardGuard vai redirecionar)
    if (!user) {
      console.log("[SubscriptionGuard] Sem usuário")
      setChecking(false)
      return
    }

    // Super admin sempre tem acesso
    if (user.role === "super_admin") {
      console.log("[SubscriptionGuard] Super admin, acesso direto")
      setChecking(false)
      return
    }

    // Sem centroId = não fazer nada
    if (!user.centroId) {
      console.log("[SubscriptionGuard] Sem centroId")
      setChecking(false)
      return
    }

    // Já está em rota bloqueada permitida
    if (isBlockedRoute) {
      console.log("[SubscriptionGuard] Em rota bloqueada permitida")
      setChecking(false)
      return
    }

    // Iniciar verificação de subscrição
    checkSubscription(user.centroId)
  }, [user, authLoading, pathname])

  // Refrescar quando volta à aba visível (opcional, pode ser desativado se causar problemas)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user && user.centroId && !isBlockedRoute) {
        console.log("[SubscriptionGuard] Aba voltou a ser visível, refrescando subscrição")
        checkSubscription(user.centroId)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [user, isBlockedRoute])

  // Registrar listener para refresh disparado externamente
  useEffect(() => {
    const unsubscribe = onRefreshTriggered(() => {
      console.log("[SubscriptionGuard] Refresh disparado externamente")
      if (user && user.centroId) {
        checkSubscription(user.centroId)
      }
    })

    return unsubscribe
  }, [onRefreshTriggered, user])

  const checkSubscription = async (centroId: string) => {
    try {
      // NÃO colocar setChecking(true) aqui - evita reload visual desnecessário
      // Só usar setChecking para a verificação inicial
      
      // Buscar dados do centro
      const centro = await centroService.getById(centroId)
      if (!centro) {
        console.log("[SubscriptionGuard] Centro não encontrado")
        setSubscriptionStatus({ hasAccess: false, status: "blocked", message: "Centro não encontrado" })
        return
      }

      console.log("[SubscriptionGuard] Centro:", centro?.name, "Status:", centro.subscriptionStatus)

      // Se o centro foi explicitamente bloqueado, bloquear
      if (centro.subscriptionStatus === "blocked") {
        console.log("[SubscriptionGuard] Centro bloqueado")
        setSubscriptionStatus({
          hasAccess: false,
          status: "blocked",
          message: "Conta bloqueada. Entre em contacto com o suporte.",
        })
        return
      }

      // PRIMEIRO: Verificar se está em período de teste ANTES de checar subscrição
      if (centro.trialEndsAt) {
        const now = new Date()
        const trialEndDate = new Date(centro.trialEndsAt)
        const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysRemaining > 0) {
          console.log("[SubscriptionGuard] Período de teste ativo, dias restantes:", daysRemaining)
          setSubscriptionStatus({
            hasAccess: true,
            status: "trial",
            daysRemaining,
            message: `Período de teste - ${daysRemaining} dias restantes`,
          })
          return
        } else {
          // Teste expirado - agora verificar se há subscrição ativa
          console.log("[SubscriptionGuard] Período de teste expirado")
        }
      }

      // SEGUNDO: Verificar subscrição ativa (se não há trial ativo)
      if (centro.subscriptionStatus === "active") {
        try {
          const subscriptions = await subscriptionService.getByCentroId(centroId)
          const activeSubscription = subscriptions.find((s) => s.status === "active")

          if (activeSubscription) {
            const now = new Date()
            const endDate = new Date(activeSubscription.endDate)
            const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

            if (daysRemaining > 0) {
              console.log("[SubscriptionGuard] Subscrição ativa, dias restantes:", daysRemaining)
              setSubscriptionStatus({
                hasAccess: true,
                status: "active",
                daysRemaining,
                message: `Subscrição ativa - ${daysRemaining} dias restantes`,
              })
              return
            }
          }
        } catch (subError) {
          console.error("[SubscriptionGuard] Erro ao verificar subscrições:", subError)
        }

        // Status é "active" mas não tem subscrição ativa = precisa renovar
        console.log("[SubscriptionGuard] Status active mas sem subscrição ativa")
        setSubscriptionStatus({
          hasAccess: false,
          status: "expired",
          message: "Sua subscrição expirou. Renove para continuar usando a plataforma.",
        })
        return
      }

      // Qualquer outro status = bloqueado
      console.log("[SubscriptionGuard] Status desconhecido ou pendente:", centro.subscriptionStatus)
      setSubscriptionStatus({
        hasAccess: false,
        status: "expired",
        message: "Status de subscrição inválido. Entre em contacto com o suporte.",
      })
    } catch (error) {
      console.error("[SubscriptionGuard] Erro ao verificar subscrição:", error)
      setSubscriptionStatus({ hasAccess: false, status: "expired", message: "Erro ao verificar acesso" })
    } finally {
      // Só colocar checking como false na verificação inicial (quando checking era true)
      // Nas verificações subsequentes (polling), NÃO mudamos checking
      if (checking) {
        setChecking(false)
      }
    }
  }

  // Efeito para redirecionamento quando status muda
  useEffect(() => {
    if (checking) {
      return
    }

    if (!user) {
      // Sem usuário, deixar para DashboardGuard redirecionar
      return
    }

    if (user.role === "super_admin") {
      return
    }

    if (!user.centroId) {
      return
    }

    // Se está em rota bloqueada permitida, deixar passar
    if (isBlockedRoute) {
      return
    }

    // Se sem acesso e não está em rota permitida, redirecionar para bloqueado
    if (subscriptionStatus && !subscriptionStatus.hasAccess && !hasRedirected) {
      console.log("[SubscriptionGuard] Sem acesso, redirecionando para /dashboard/blocked")
      setHasRedirected(true)
      router.push("/dashboard/blocked")
    }
  }, [checking, user, subscriptionStatus?.hasAccess, isBlockedRoute, hasRedirected, router])

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

  if (subscriptionStatus?.hasAccess || isBlockedRoute) {
    return (
      <>
        {subscriptionStatus?.status === "trial" && !isBlockedRoute && (
          <TrialExpiringDialog
            daysRemaining={subscriptionStatus.daysRemaining || 0}
            onRenew={() => router.push("/dashboard/subscription")}
          />
        )}
        {children}
      </>
    )
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
              onClick={() => {
                const whatsappNumber = "244948324028" // Angola +244
                const message = "Olá, pretendo renovar a minha subscrição na plataforma Formação-AO"
                const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
                window.open(whatsappUrl, "_blank")
              }}
            >
              Contactar via WhatsApp
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
