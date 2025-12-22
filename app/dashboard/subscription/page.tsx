"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { subscriptionService } from "@/lib/supabase-services"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Calendar, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Subscription } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"

const plans = [
  { name: "Mensal", months: 1, price: 15000, popular: false },
  { name: "Trimestral", months: 3, price: 40000, popular: true },
  { name: "Semestral", months: 6, price: 75000, popular: false },
  { name: "Anual", months: 12, price: 150000, popular: false },
]

export default function SubscriptionPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!currentUser?.centroId) {
      router.push("/login")
      return
    }
    loadSubscriptions(currentUser.centroId)
  }, [currentUser, router])

  const loadSubscriptions = async (centroId: string) => {
    try {
      setLoading(true)
      const data = await subscriptionService.getByCentroId(centroId)
      setSubscriptions(data)
    } catch (error) {
      console.error("Erro ao carregar subscrições:", error)
      toast({ title: "Erro ao carregar subscrições", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const activeSubscription = subscriptions.find((s) => s.status === "active")
  const isExpiringSoon = activeSubscription && new Date(activeSubscription.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  if (!currentUser) return null

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-7xl py-6 md:py-8 px-4 md:px-6">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Subscrição</h1>
            <p className="text-muted-foreground">Gerencie sua subscrição e histórico de pagamentos</p>
          </div>

          {/* Status Atual */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Status da Subscrição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSubscription ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge
                        variant={activeSubscription.status === "active" ? "default" : "secondary"}
                      >
                        {activeSubscription.status === "active" ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>

                    {isExpiringSoon && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Sua subscrição está próxima do vencimento</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Plano:</span>
                      <span className="text-sm capitalize">{activeSubscription.plan}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Válido até:</span>
                      <span className="text-sm">{new Date(activeSubscription.endDate).toLocaleDateString("pt-AO")}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Você não possui uma subscrição ativa</p>
                    <p className="text-sm text-muted-foreground">Escolha um plano abaixo para começar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Planos de Renovação */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Planos Disponíveis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <Card key={plan.months} className={plan.popular ? "border-primary border-2" : ""}>
                  {plan.popular && (
                    <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                      Mais Popular
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-2xl font-bold text-foreground">
                        {plan.price.toLocaleString("pt-AO")} Kz
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      disabled={loading}
                    >
                      {loading ? "Processando..." : "Contratar"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Histórico */}
          <div>
            <h2 className="text-xl font-bold mb-4">Histórico de Subscrições</h2>
            <div className="space-y-4">
              {subscriptions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma subscrição encontrada</p>
                  </CardContent>
                </Card>
              ) : (
                subscriptions.map((sub: Subscription) => (
                  <Card key={sub.id}>
                    <CardContent className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-medium capitalize">Plano {sub.plan}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(sub.startDate).toLocaleDateString("pt-AO")} - {new Date(sub.endDate).toLocaleDateString("pt-AO")}
                          </div>
                        </div>
                        <Badge
                          variant={
                            sub.paymentStatus === "approved"
                              ? "default"
                              : sub.paymentStatus === "pending"
                                ? "outline"
                                : "destructive"
                          }
                        >
                          {sub.paymentStatus === "approved"
                            ? "Aprovado"
                            : sub.paymentStatus === "pending"
                              ? "Pendente"
                              : "Rejeitado"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
