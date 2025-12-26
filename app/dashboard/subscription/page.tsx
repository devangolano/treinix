"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { subscriptionService, centroService } from "@/lib/supabase-services"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Calendar, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Subscription } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

const MONTHLY_PRICE = 5000 // 5.000 Kz por mês

export default function SubscriptionPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [centroData, setCentroData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedMonths, setSelectedMonths] = useState<number>(1)
  const { toast } = useToast()

  useEffect(() => {
    if (!currentUser?.centroId) {
      router.push("/login")
      return
    }
    loadSubscriptions(currentUser.centroId)
    loadCentroData(currentUser.centroId)
  }, [currentUser, router])

  const loadCentroData = async (centroId: string) => {
    try {
      const data = await centroService.getById(centroId)
      console.log("Dados do centro:", data)
      setCentroData(data)
    } catch (error) {
      console.error("Erro ao carregar dados do centro:", error)
    }
  }

  const loadSubscriptions = async (centroId: string) => {
    try {
      setLoading(true)
      const data = await subscriptionService.getByCentroId(centroId)
      console.log("Subscrições carregadas:", data)
      setSubscriptions(data)
    } catch (error) {
      console.error("Erro ao carregar subscrições:", error)
      toast({ title: "Erro ao carregar subscrições", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Verificar se há trial ativo (verifica se trialEndsAt existe E está no futuro)
  const hasActiveTrial = centroData?.trialEndsAt && new Date(centroData.trialEndsAt) > new Date()

  // Encontrar APENAS subscrições ATIVAS (status="active")
  const activeSubs = subscriptions.filter((s) => s.status === "active")
  
  let finalEndDate = null
  let totalMonths = 0
  let currentActiveSubscription = null
  
  // Calcular dias restantes
  const calculateDaysRemaining = (endDate: Date | string) => {
    const end = new Date(endDate)
    const now = new Date()
    
    // Zerar horas/minutos/segundos para calcular apenas os dias
    end.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)
    
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays) // Retorna no mínimo 0
  }
  
  // Lógica: Se tem TRIAL OU SUBSCRIÇÃO, mostra dados (somando ambos se existirem)
  if (hasActiveTrial || activeSubs.length > 0) {
    // Somar meses apenas das subscrições pagas
    totalMonths = activeSubs.reduce((sum, sub) => sum + sub.months, 0)
    
    // Encontrar data final APENAS das subscrições pagas (sem trial)
    if (activeSubs.length > 0) {
      const subDates = activeSubs.map(s => s.endDate)
      finalEndDate = subDates.reduce((latest, current) => {
        const latestDate = new Date(latest)
        const currentDate = new Date(current)
        return currentDate > latestDate ? current : latest
      })
    }
    
    // Se tem subscrição, usa dados dela; senão usa trial
    currentActiveSubscription = {
      ...(activeSubs.length > 0 ? activeSubs[0] : { plan: "trial", status: "active", paymentStatus: "approved" }),
      endDate: finalEndDate || centroData?.trialEndsAt,
      months: totalMonths,
    }
  }

  const isExpiringSoon = currentActiveSubscription && new Date(currentActiveSubscription.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  
  // Calcular dias restantes: considerar trial + subscrição
  let daysRemaining = 0
  if (currentActiveSubscription) {
    // Dias restantes da subscrição
    const subDays = finalEndDate ? calculateDaysRemaining(finalEndDate) : 0
    
    // Dias restantes do trial
    const trialDays = hasActiveTrial && centroData?.trialEndsAt ? calculateDaysRemaining(centroData.trialEndsAt) : 0
    
    // Total: soma dos dias
    daysRemaining = subDays + trialDays
  }
  
  const isTrialPlan = currentActiveSubscription?.plan?.toLowerCase() === "trial"
  const pendingSubscriptions = subscriptions.filter((s) => s.paymentStatus === "pending")
  const hasPendingSubscription = pendingSubscriptions.length > 0

  const handleContractSubscription = async () => {
    if (!currentUser?.centroId || selectedMonths < 1) return

    try {
      setLoading(true)
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + selectedMonths)

      const newSubscription = await subscriptionService.create({
        centroId: currentUser.centroId,
        plan: "mensal",
        months: selectedMonths,
        status: "pending",
        startDate,
        endDate,
        paymentStatus: "pending",
      })

      if (newSubscription) {
        await loadSubscriptions(currentUser.centroId)
        toast({
          title: "Subscrição solicitada com sucesso!",
          description: "Sua solicitação de subscrição está pendente de aprovação pelo super admin.",
        })
        setSelectedMonths(1)
      }
    } catch (error) {
      console.error("Erro ao contratar subscrição:", error)
      toast({
        title: "Erro ao contratar subscrição",
        description: "Não foi possível processar sua solicitação.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) return null

  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900">
        <div className="container max-w-7xl py-6 md:py-8 px-4 md:px-6">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Subscrição</h1>
            <p className="text-blue-200">Gerencie sua subscrição e histórico de pagamentos</p>
          </div>

          {/* Alerta de Subscrição Pendente */}
          {hasPendingSubscription && (
            <Alert className="mb-6 bg-amber-900/30 border-amber-800">
              <AlertDescription className="text-amber-300">
                ⏳ Você tem {pendingSubscriptions.length} subscrição{pendingSubscriptions.length > 1 ? "ões" : ""} pendente{pendingSubscriptions.length > 1 ? "s" : ""} de aprovação. A equipa do suporte analisará sua solicitação em breve.
              </AlertDescription>
            </Alert>
          )}

          {/* Alerta de Conta Bloqueada (Sem subscrição ativa e sem trial) */}
          {!currentActiveSubscription && (
            <Alert className="mb-6 bg-red-900/30 border-red-800">
              <AlertDescription className="text-red-300">
                🔒 Sua conta está sem acesso. Você não possui uma subscrição ativa nem um período de teste ativo. Solicite uma subscrição abaixo para reativar o acesso.
              </AlertDescription>
            </Alert>
          )}

          {/* Status Atual */}
          <Card className="mb-8 bg-blue-900/30 border-blue-800">
            <CardHeader>
              <CardTitle className="text-white">Status da Subscrição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currentActiveSubscription ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-200">Status:</span>
                      <Badge
                        variant={currentActiveSubscription.paymentStatus === "approved" ? "default" : "secondary"}
                        className="bg-green-600 text-white border-green-700"
                      >
                        {currentActiveSubscription.paymentStatus === "approved" ? "Aprovada" : "Pendente"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-200">Plano:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm capitalize text-white">{currentActiveSubscription.plan}</span>
                        {isTrialPlan && (
                          <Badge className="bg-cyan-500 text-white border-cyan-600">Trial</Badge>
                        )}
                      </div>
                    </div>

                    {totalMonths > 0 && !isTrialPlan && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-200">Duração Total:</span>
                        <span className="text-sm text-white font-semibold">{totalMonths} mês{totalMonths > 1 ? "es" : ""}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-200">Válido até:</span>
                      <span className="text-sm text-white">{new Date(currentActiveSubscription.endDate).toLocaleDateString("pt-AO")}</span>
                    </div>

                    <div className="flex items-center justify-between bg-blue-800/40 border border-blue-700 p-2 rounded">
                      <span className="text-sm font-medium text-blue-200">Tempo Restante:</span>
                      <span className={`text-sm font-semibold ${daysRemaining <= 7 ? "text-orange-400" : daysRemaining <= 30 ? "text-yellow-400" : "text-green-400"}`}>
                        {daysRemaining > 0 ? `${daysRemaining} dia${daysRemaining > 1 ? "s" : ""}` : "Vencida"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-blue-300 mb-4">Você não possui uma subscrição ativa</p>
                    <p className="text-sm text-blue-300">Escolha um plano abaixo para começar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Planos de Renovação */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-2 text-white">Selecione a Duração</h2>
            <Card className="bg-blue-900/30 border-blue-800">
              <CardHeader>
                <CardTitle className="text-white">Contratação de Subscrição</CardTitle>
                <CardDescription className="text-blue-300">
                  Mensalidade: {MONTHLY_PRICE.toLocaleString("pt-AO")} Kz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="months" className="text-blue-200 font-semibold">
                    Quantos meses deseja contratar?
                  </Label>
                  <Input
                    id="months"
                    type="number"
                    min="1"
                    max="60"
                    value={selectedMonths}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      if (value > 0) setSelectedMonths(value)
                    }}
                    className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Digite o número de meses"
                  />
                  <p className="text-xs text-blue-300">Mínimo: 1 mês | Máximo: 24 meses</p>
                </div>

                <div className="border-t border-blue-800 pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-200">Duração:</span>
                      <span className="text-white font-semibold">{selectedMonths} mês{selectedMonths > 1 ? "es" : ""}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-200">Preço por mês:</span>
                      <span className="text-white font-semibold">{MONTHLY_PRICE.toLocaleString("pt-AO")} Kz</span>
                    </div>
                    <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/30 p-1 rounded">
                      <span className="text-orange-300 font-semibold">Total:</span>
                      <span className="text-orange-400 font-bold text-lg">
                        {(MONTHLY_PRICE * selectedMonths).toLocaleString("pt-AO")} Kz
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleContractSubscription}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 text-base"
                  disabled={loading || selectedMonths < 1}
                >
                  {loading ? "Processando..." : `Contratar por ${selectedMonths} mês${selectedMonths > 1 ? "es" : ""}`}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Histórico */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-white">Histórico de Subscrições</h2>
            <div className="space-y-4">
              {subscriptions.length === 0 ? (
                <Card className="bg-blue-900/30 border-blue-800">
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <p className="text-blue-300">Nenhuma subscrição encontrada</p>
                  </CardContent>
                </Card>
              ) : (
                subscriptions.map((sub: Subscription) => (
                  <Card key={sub.id} className="bg-blue-900/30 border-blue-800 hover:border-orange-500 transition-colors">
                    <CardContent className="">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-medium capitalize text-white">Plano {sub.plan}</p>
                          <div className="flex items-center gap-2 text-sm text-blue-300">
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
                          className={`${
                            sub.paymentStatus === "approved"
                              ? "bg-green-600 text-white border-green-700"
                              : sub.paymentStatus === "pending"
                                ? "border-blue-700 text-blue-300 bg-blue-900/50"
                                : "bg-red-600 text-white border-red-700"
                          }`}
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
