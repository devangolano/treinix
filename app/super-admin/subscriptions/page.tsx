"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SuperAdminSidebar } from "@/components/super-admin-sidebar"
import { Spinner } from "@/components/ui/spinner"
import { centroService, subscriptionService } from "@/lib/supabase-services"
import type { Subscription, Centro } from "@/lib/types"
import { Check, X, Calendar, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [centros, setCentros] = useState<Record<string, Centro>>({})
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const centrosData = await centroService.getAll()
      const centrosMap = centrosData.reduce(
        (acc, centro) => ({
          ...acc,
          [centro.id]: centro,
        }),
        {} as Record<string, Centro>
      )
      setCentros(centrosMap)

      // Carregar subscrições de todos os centros
      const allSubscriptions = await Promise.all(
        centrosData.map((centro) => subscriptionService.getByCentroId(centro.id))
      )
      setSubscriptions(allSubscriptions.flat())
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar subscrições.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (subscriptionId: string) => {
    setApprovingId(subscriptionId)
    try {
      await subscriptionService.update(subscriptionId, { paymentStatus: "approved" })
      await loadData()
      toast({
        title: "Subscrição aprovada",
        description: "A subscrição foi aprovada com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a subscrição.",
        variant: "destructive",
      })
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (subscriptionId: string) => {
    setApprovingId(subscriptionId)
    try {
      await subscriptionService.update(subscriptionId, { paymentStatus: "rejected" })
      await loadData()
      toast({
        title: "Subscrição rejeitada",
        description: "A subscrição foi rejeitada.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a subscrição.",
        variant: "destructive",
      })
    } finally {
      setApprovingId(null)
    }
  }

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      mensal: "Mensal",
      trimestral: "Trimestral",
      semestral: "Semestral",
      anual: "Anual",
    }
    return labels[plan] || plan
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pendente" },
      approved: { variant: "default", label: "Aprovada" },
      rejected: { variant: "destructive", label: "Rejeitada" },
    }
    const config = variants[status] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getSubscriptionStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      trial: { variant: "secondary", label: "Teste" },
      active: { variant: "default", label: "Ativa" },
      pending: { variant: "outline", label: "Pendente" },
      expired: { variant: "destructive", label: "Expirada" },
      blocked: { variant: "destructive", label: "Bloqueada" },
    }
    const config = variants[status] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-900">
        <SuperAdminSidebar />
        <div className="flex-1 flex items-center justify-center bg-slate-900">
          <Spinner />
        </div>
      </div>
    )
  }

  const pendingSubscriptions = subscriptions.filter((s) => s.paymentStatus === "pending")
  const approvedSubscriptions = subscriptions.filter((s) => s.paymentStatus === "approved")
  const rejectedSubscriptions = subscriptions.filter((s) => s.paymentStatus === "rejected")

  return (
    <div className="flex h-screen">
      <SuperAdminSidebar />

      <div className="flex-1 overflow-auto">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Gestão de Subscrições</h1>
            <p className="text-muted-foreground">Aprovação e gestão de planos de subscrição</p>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList>
              <TabsTrigger value="pending">
                Pendentes <Badge className="ml-2" variant="outline">{pendingSubscriptions.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="approved">
                Aprovadas <Badge className="ml-2" variant="outline">{approvedSubscriptions.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejeitadas <Badge className="ml-2" variant="outline">{rejectedSubscriptions.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {pendingSubscriptions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Nenhuma subscrição pendente</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingSubscriptions.map((subscription) => {
                    const centro = centros[subscription.centroId]
                    return (
                      <Card key={subscription.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">{centro?.name || "Centro desconhecido"}</CardTitle>
                              <p className="text-sm text-muted-foreground">{centro?.email}</p>
                            </div>
                            <div className="flex gap-2">
                              {getStatusBadge(subscription.paymentStatus)}
                              {getSubscriptionStatusBadge(subscription.status)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Plano</p>
                                <p className="font-medium">{getPlanLabel(subscription.plan)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Duração</p>
                                <p className="font-medium">{subscription.months} mês(es)</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <div>
                                  <p className="text-muted-foreground text-xs mb-1">Início</p>
                                  <p className="font-medium text-xs">
                                    {new Date(subscription.startDate).toLocaleDateString("pt-AO")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <div>
                                  <p className="text-muted-foreground text-xs mb-1">Fim</p>
                                  <p className="font-medium text-xs">
                                    {new Date(subscription.endDate).toLocaleDateString("pt-AO")}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(subscription.id)}
                                disabled={approvingId === subscription.id}
                                className="gap-2"
                              >
                                <Check className="h-4 w-4" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(subscription.id)}
                                disabled={approvingId === subscription.id}
                                className="gap-2"
                              >
                                <X className="h-4 w-4" />
                                Rejeitar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              {approvedSubscriptions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Nenhuma subscrição aprovada</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {approvedSubscriptions.map((subscription) => {
                    const centro = centros[subscription.centroId]
                    return (
                      <Card key={subscription.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">{centro?.name || "Centro desconhecido"}</CardTitle>
                              <p className="text-sm text-muted-foreground">{centro?.email}</p>
                            </div>
                            <div className="flex gap-2">
                              {getStatusBadge(subscription.paymentStatus)}
                              {getSubscriptionStatusBadge(subscription.status)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Plano</p>
                              <p className="font-medium">{getPlanLabel(subscription.plan)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Duração</p>
                              <p className="font-medium">{subscription.months} mês(es)</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Início</p>
                                <p className="font-medium text-xs">
                                  {new Date(subscription.startDate).toLocaleDateString("pt-AO")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Fim</p>
                                <p className="font-medium text-xs">
                                  {new Date(subscription.endDate).toLocaleDateString("pt-AO")}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {rejectedSubscriptions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Nenhuma subscrição rejeitada</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {rejectedSubscriptions.map((subscription) => {
                    const centro = centros[subscription.centroId]
                    return (
                      <Card key={subscription.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">{centro?.name || "Centro desconhecido"}</CardTitle>
                              <p className="text-sm text-muted-foreground">{centro?.email}</p>
                            </div>
                            <div className="flex gap-2">
                              {getStatusBadge(subscription.paymentStatus)}
                              {getSubscriptionStatusBadge(subscription.status)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Plano</p>
                              <p className="font-medium">{getPlanLabel(subscription.plan)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Duração</p>
                              <p className="font-medium">{subscription.months} mês(es)</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Início</p>
                                <p className="font-medium text-xs">
                                  {new Date(subscription.startDate).toLocaleDateString("pt-AO")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Fim</p>
                                <p className="font-medium text-xs">
                                  {new Date(subscription.endDate).toLocaleDateString("pt-AO")}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
