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

      // Buscar subscrições ATIVAS (status="active")
      const subs = await subscriptionService.getByCentroId(centroId)
      const activeSubs = subs.filter((s) => s.status === "active")
      
      // Verificar se há trial ativo
      const hasActiveTrial = centroData.trialEndsAt && new Date(centroData.trialEndsAt) > new Date()
      
      // Função para calcular dias restantes
      const calculateDaysRemaining = (endDate: Date | string) => {
        const end = new Date(endDate)
        const now = new Date()
        end.setHours(0, 0, 0, 0)
        now.setHours(0, 0, 0, 0)
        const diffTime = end.getTime() - now.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        return Math.max(0, diffDays)
      }
      
      // PRIORIDADE: Se tem subscrição paga, mostra ela; senão mostra trial
      if (activeSubs.length > 0) {
        // Somar todos os meses das subscrições ativas
        const totalMonths = activeSubs.reduce((sum, sub) => sum + sub.months, 0)
        
        // Encontrar a data mais distante APENAS das subscrições (sem trial)
        const allDates = activeSubs.map(s => s.endDate)
        const finalEndDate = allDates.reduce((latest, current) => {
          const latestDate = new Date(latest)
          const currentDate = new Date(current)
          return currentDate > latestDate ? current : latest
        })
        
        // Calcular dias restantes: subscrição + trial (se houver)
        const subDays = calculateDaysRemaining(finalEndDate)
        const trialDays = hasActiveTrial && centroData.trialEndsAt ? calculateDaysRemaining(centroData.trialEndsAt) : 0
        const totalDaysRemaining = subDays + trialDays
        
        // Criar subscrição combinada com totais
        setSubscription({
          ...activeSubs[0],
          endDate: finalEndDate,
          months: totalMonths,
          daysRemaining: totalDaysRemaining,
        })
      } else if (hasActiveTrial) {
        // Se não tem subscrição paga mas tem trial, mostrar trial
        const trialDays = centroData.trialEndsAt ? calculateDaysRemaining(centroData.trialEndsAt) : 0
        setSubscription({
          plan: "trial",
          status: "active",
          paymentStatus: "approved",
          endDate: centroData.trialEndsAt,
          months: 0,
          daysRemaining: trialDays,
        })
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
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
        <SuperAdminSidebar />
        <div className="flex-1 flex items-center justify-center bg-slate-900">
          <Spinner />
        </div>
      </div>
    )
  }

  if (!centro) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
        <SuperAdminSidebar />
        <div className="flex-1 flex items-center justify-center pt-16 md:pt-0">
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
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
      <SuperAdminSidebar />

      <div className="flex-1 overflow-auto bg-slate-900 pt-16 md:pt-0">
        <div className="w-full max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6">
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
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white">{centro.name}</h1>
                <p className="text-blue-300 mt-2">Detalhes do centro de formação</p>
              </div>
              {/* Mostrar status: se tem subscrição ativa, mostra "active"; senão "trial" se houver; senão status normal */}
              {getStatusBadge(subscription ? (subscription.plan === "trial" ? "trial" : "active") : centro.subscriptionStatus)}
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
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="break-all">{centro.email}</span>
                  </div>
                </div>

                <div>
                  <p className="text-blue-300 text-sm">Telefone</p>
                  <div className="flex items-center gap-2 text-white mt-1">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{centro.phone}</span>
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
                  <div className="mt-2">
                    {/* Mostrar status: se tem subscrição ativa, mostra "active"; senão "trial" se houver; senão status normal */}
                    {getStatusBadge(subscription ? (subscription.plan === "trial" ? "trial" : "active") : centro.subscriptionStatus)}
                  </div>
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
          {subscription ? (
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
                      {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString("pt-AO") : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-blue-300 text-sm">Data de Término</p>
                    <p className="text-white font-semibold mt-1">
                      {new Date(subscription.endDate).toLocaleDateString("pt-AO")}
                    </p>
                  </div>

                  <div>
                    <p className="text-blue-300 text-sm">Tempo Restante</p>
                    <p className={`font-semibold mt-1 ${subscription.daysRemaining <= 7 ? "text-orange-400" : subscription.daysRemaining <= 30 ? "text-yellow-400" : "text-green-400"}`}>
                      {subscription.daysRemaining > 0 ? `${subscription.daysRemaining} dia${subscription.daysRemaining > 1 ? "s" : ""}` : "Vencida"}
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
          ) : (
            <Card className="bg-red-900/20 border-red-800">
              <CardHeader>
                <CardTitle className="text-red-400">Sem Subscrição Ativa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-300">
                  Este centro não possui uma subscrição ativa aprovada. 
                  {centro.subscriptionStatus === "trial" && centro.trialEndsAt && new Date(centro.trialEndsAt) > new Date() 
                    ? ` Está utilizando o período de teste que termina em ${new Date(centro.trialEndsAt).toLocaleDateString("pt-AO")}.`
                    : " Solicite uma subscrição para reativar o acesso."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
