"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SuperAdminSidebar } from "@/components/super-admin-sidebar"
import { Spinner } from "@/components/ui/spinner"
import { centroService, subscriptionService } from "@/lib/supabase-services"
import type { Centro } from "@/lib/types"
import { Phone, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CentrosPage() {
  const [centros, setCentros] = useState<Centro[]>([])
  const [subscriptions, setSubscriptions] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadCentros()
  }, [])

  const loadCentros = async () => {
    try {
      setLoading(true)
      const data = await centroService.getAll()
      setCentros(data)

      // Buscar subscrições ativas para cada centro
      const subsMap: Record<string, any> = {}
      for (const centro of data) {
        try {
          const subs = await subscriptionService.getByCentroId(centro.id)
          // Procurar subscrição ATIVA (status="active")
          const activeSub = subs.find((s) => s.status === "active")
          if (activeSub) {
            subsMap[centro.id] = activeSub
            console.log(`[CentrosPage] Subscrição ativa encontrada para ${centro.name}:`, activeSub)
          }
        } catch (error) {
          console.error(`Erro ao buscar subscrição do centro ${centro.id}:`, error)
        }
      }
      setSubscriptions(subsMap)
    } catch (error) {
      console.error("Erro ao carregar centros:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os centros.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
      <SuperAdminSidebar />

      <div className="flex-1 overflow-auto bg-slate-900 pt-16 md:pt-0">
        <div className="w-full max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Gestão de Centros</h1>
            <p className="text-blue-300">Gerencie todos os centros de formação registrados</p>
          </div>

          {centros.length === 0 ? (
            <Card className="bg-blue-900/30 border-blue-800">
              <CardContent className="py-8 text-center">
                <p className="text-blue-300">Nenhum centro registrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {centros.map((centro) => {
                // Verificar se tem trial ativo
                const hasActiveTrial = centro.trialEndsAt && new Date(centro.trialEndsAt) > new Date()
                
                // Verificar se tem subscrição paga ativa
                const hasActiveSub = subscriptions[centro.id] !== undefined
                
                // PRIORIDADE: Se tem subscrição paga, mostra "Ativo"; se tem só trial, mostra "Teste"
                const displayStatus = hasActiveSub ? "active" : (hasActiveTrial ? "trial" : centro.subscriptionStatus)
                
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
                
                // Encontrar data final APENAS das subscrições (sem trial)
                let planEndDate = null
                let daysRemaining = 0
                
                if (hasActiveSub) {
                  // Tem subscrição: usa data da subscrição
                  planEndDate = subscriptions[centro.id].endDate
                  const subDays = calculateDaysRemaining(planEndDate)
                  const trialDays = hasActiveTrial && centro.trialEndsAt ? calculateDaysRemaining(centro.trialEndsAt) : 0
                  daysRemaining = subDays + trialDays
                } else if (hasActiveTrial && centro.trialEndsAt) {
                  // Só tem trial
                  planEndDate = centro.trialEndsAt
                  daysRemaining = calculateDaysRemaining(planEndDate)
                }
                
                const planEndDateStr = planEndDate
                  ? new Date(planEndDate).toLocaleDateString("pt-AO")
                  : "-"

                return (
                  <Link key={centro.id} href={`/super-admin/centros/${centro.id}`}>
                    <Card className="bg-blue-900/30 border-blue-800 hover:bg-blue-900/50 hover:border-orange-500 transition-all cursor-pointer">
                      <CardContent className="py-2 px-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Informação Principal: Nome */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white truncate">{centro.name}</h3>
                          </div>

                          {/* Telefone */}
                          <div className="flex items-center gap-2 text-blue-300 md:mx-2 whitespace-nowrap text-sm">
                            <Phone className="h-4 w-4 shrink-0" />
                            <span className="hidden sm:inline">{centro.phone}</span>
                          </div>

                          {/* Status */}
                          <div className="md:mx-2">
                            {getStatusBadge(displayStatus)}
                          </div>

                          {/* Término do Plano */}
                          <div className="text-right md:mx-2">
                            <p className="text-xs text-blue-300">Término do plano</p>
                            <p className="text-sm font-semibold text-white">{planEndDateStr}</p>
                          </div>

                          {/* Tempo Restante */}
                          <div className="text-right md:mx-2">
                            <p className="text-xs text-blue-300">Tempo restante</p>
                            <p className={`text-sm font-semibold ${daysRemaining <= 7 ? "text-orange-400" : daysRemaining <= 30 ? "text-yellow-400" : "text-green-400"}`}>
                              {daysRemaining > 0 ? `${daysRemaining} dia${daysRemaining > 1 ? "s" : ""}` : "-"}
                            </p>
                          </div>

                          {/* Seta */}
                          <ChevronRight className="h-5 w-5 text-blue-400 shrink-0 hidden md:block" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
