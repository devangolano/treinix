"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SuperAdminSidebar } from "@/components/super-admin-sidebar"
import { Spinner } from "@/components/ui/spinner"
import { centroService, subscriptionService } from "@/lib/supabase-services"
import type { Centro } from "@/lib/types"
import { ArrowLeft, Lock, Unlock, Phone, Mail, MapPin, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSubscriptionRefresh } from "@/hooks/use-subscription-refresh"

export default function CentroDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const centroId = params.id as string

  const [centro, setCentro] = useState<Centro | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [blocking, setBlocking] = useState(false)
  const { toast } = useToast()
  const { triggerRefresh } = useSubscriptionRefresh()

  useEffect(() => {
    loadCentroDetails()
  }, [centroId])

  const loadCentroDetails = async () => {
    try {
      setLoading(true)
      const centroData = await centroService.getById(centroId)
      if (!centroData) {
        toast({
          title: "Erro",
          description: "Centro não encontrado.",
          variant: "destructive",
        })
        router.push("/super-admin/centros")
        return
      }

      setCentro(centroData)

      // Buscar subscrição ativa
      const subs = await subscriptionService.getByCentroId(centroId)
      const activeSub = subs.find(
        (s) => s.status === "active" || (s.status === "pending" && s.paymentStatus === "approved")
      )
      if (activeSub) {
        setSubscription(activeSub)
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes do centro:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do centro.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBlock = async () => {
    if (!centro) return
    setBlocking(true)
    try {
      await centroService.update(centroId, { subscriptionStatus: "blocked" })
      await loadCentroDetails()
      triggerRefresh()
      toast({
        title: "Centro bloqueado",
        description: "O centro foi bloqueado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível bloquear o centro.",
        variant: "destructive",
      })
    } finally {
      setBlocking(false)
    }
  }

  const handleUnblock = async () => {
    if (!centro) return
    setBlocking(true)
    try {
      await centroService.update(centroId, { subscriptionStatus: "active" })
      await loadCentroDetails()
      triggerRefresh()
      toast({
        title: "Centro desbloqueado",
        description: "O centro foi desbloqueado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível desbloquear o centro.",
        variant: "destructive",
      })
    } finally {
      setBlocking(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      active: { variant: "default", label: "Ativo" },
      trial: { variant: "secondary", label: "Teste" },
      expired: { variant: "destructive", label: "Expirado" },
      blocked: { variant: "destructive", label: "Bloqueado" },
      pending: { variant: "outline", label: "Pendente" },
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

  if (!centro) {
    return (
      <div className="flex h-screen bg-slate-900">
        <SuperAdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white">
            <p className="mb-4">Centro não encontrado</p>
            <Button onClick={() => router.push("/super-admin/centros")}>
              Voltar para Centros
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-900">
      <SuperAdminSidebar />

      <div className="flex-1 overflow-auto bg-slate-900">
        <div className="container py-8">
          {/* Header com botão voltar */}
          <div className="mb-8">
            <Button
              variant="ghost"
              className="mb-4 text-blue-300 hover:text-orange-400"
              onClick={() => router.push("/super-admin/centros")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white">{centro.name}</h1>
                <p className="text-blue-300 mt-2">Detalhes do centro de formação</p>
              </div>
              {getStatusBadge(centro.subscriptionStatus)}
            </div>
          </div>

          {/* Informações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Informações do Centro */}
            <Card className="bg-blue-900/30 border-blue-800">
              <CardHeader>
                <CardTitle className="text-white">Informações do Centro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-blue-300 text-sm">Email</p>
                  <div className="flex items-center gap-2 text-white mt-1">
                    <Mail className="h-4 w-4" />
                    {centro.email}
                  </div>
                </div>

                <div>
                  <p className="text-blue-300 text-sm">Telefone</p>
                  <div className="flex items-center gap-2 text-white mt-1">
                    <Phone className="h-4 w-4" />
                    {centro.phone}
                  </div>
                </div>

                <div>
                  <p className="text-blue-300 text-sm">Endereço</p>
                  <div className="flex items-start gap-2 text-white mt-1">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>{centro.address}</p>
                  </div>
                </div>

                {centro.nif && (
                  <div>
                    <p className="text-blue-300 text-sm">NIF</p>
                    <p className="font-mono text-white mt-1">{centro.nif}</p>
                  </div>
                )}

                <div>
                  <p className="text-blue-300 text-sm">Data de Criação</p>
                  <div className="flex items-center gap-2 text-white mt-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(centro.createdAt).toLocaleDateString("pt-AO")}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações de Subscrição/Teste */}
            <Card className="bg-blue-900/30 border-blue-800">
              <CardHeader>
                <CardTitle className="text-white">Status de Acesso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-blue-300 text-sm">Status atual</p>
                  <div className="mt-2">{getStatusBadge(centro.subscriptionStatus)}</div>
                </div>

                {centro.trialEndsAt && (
                  <div>
                    <p className="text-blue-300 text-sm">Período de Teste</p>
                    <div className="flex items-center gap-2 text-white mt-1">
                      <Calendar className="h-4 w-4" />
                      Termina em {new Date(centro.trialEndsAt).toLocaleDateString("pt-AO")}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  {centro.subscriptionStatus === "blocked" ? (
                    <Button
                      onClick={handleUnblock}
                      disabled={blocking}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Unlock className="h-4 w-4" />
                      Desbloquear
                    </Button>
                  ) : (
                    <Button
                      onClick={handleBlock}
                      disabled={blocking}
                      variant="destructive"
                      className="gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Bloquear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscrição Ativa */}
          {subscription && (
            <Card className="bg-green-900/20 border-green-800">
              <CardHeader>
                <CardTitle className="text-green-400">Subscrição Ativa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-blue-300 text-sm">Plano</p>
                    <p className="text-white font-semibold capitalize mt-1">{subscription.plan}</p>
                  </div>

                  <div>
                    <p className="text-blue-300 text-sm">Duração</p>
                    <p className="text-white font-semibold mt-1">{subscription.months} mês(es)</p>
                  </div>

                  <div>
                    <p className="text-blue-300 text-sm">Data de Início</p>
                    <p className="text-white font-semibold mt-1">
                      {new Date(subscription.startDate).toLocaleDateString("pt-AO")}
                    </p>
                  </div>

                  <div>
                    <p className="text-blue-300 text-sm">Data de Término</p>
                    <p className="text-white font-semibold mt-1">
                      {new Date(subscription.endDate).toLocaleDateString("pt-AO")}
                    </p>
                  </div>

                  <div>
                    <p className="text-blue-300 text-sm">Status de Pagamento</p>
                    <Badge
                      variant={subscription.paymentStatus === "approved" ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {subscription.paymentStatus === "approved" ? "Aprovada" : "Pendente"}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-blue-300 text-sm">Status da Subscrição</p>
                    <Badge variant={subscription.status === "active" ? "default" : "outline"} className="mt-1">
                      {subscription.status === "active" ? "Ativa" : "Pendente"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
