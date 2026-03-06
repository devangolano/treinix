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
import { Phone, MapPin, Users, Calendar, TrendingUp, ChevronRight, Plus, ChevronLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CentrosPage() {
  const [centros, setCentros] = useState<Centro[]>([])
  const [subscriptions, setSubscriptions] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
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

  const calculateDaysRemaining = (endDate: Date | string) => {
    const end = new Date(endDate)
    const now = new Date()
    end.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
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

  // Calcular paginação
  const totalPages = Math.ceil(centros.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const centrosPaginados = centros.slice(startIndex, endIndex)

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
      <SuperAdminSidebar />

      <div className="flex-1 overflow-auto bg-slate-900 pt-16 md:pt-0">
        <div className="w-full max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Gestão de Centros</h1>
              <p className="text-blue-300 mt-2">Gerencie todos os centros de formação registrados ({centros.length})</p>
            </div>
            <Link href="/super-admin/centros/novo">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2">
                <Plus className="h-4 w-4" />
                Novo Centro
              </Button>
            </Link>
          </div>

          {centros.length === 0 ? (
            <Card className="bg-blue-900/30 border-blue-800">
              <CardContent className="py-12 text-center">
                <p className="text-blue-300 text-lg">Nenhum centro registrado</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {centrosPaginados.map((centro) => {
                  // Verificar se tem trial ativo
                  const hasActiveTrial = centro.trialEndsAt && new Date(centro.trialEndsAt) > new Date()

                  // Verificar se tem subscrição paga ativa
                  const hasActiveSub = subscriptions[centro.id] !== undefined

                  // PRIORIDADE: Se tem subscrição paga, mostra "Ativo"; se tem só trial, mostra "Teste"
                  const displayStatus = hasActiveSub ? "active" : hasActiveTrial ? "trial" : centro.subscriptionStatus

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

                const planEndDateStr = planEndDate ? new Date(planEndDate).toLocaleDateString("pt-AO") : "-"

                return (
                  <Link key={centro.id} href={`/super-admin/centros/${centro.id}`}>
                    <Card className="bg-blue-900/40 border-blue-800 hover:bg-blue-900/60 hover:border-orange-500 transition-all cursor-pointer group">
                      <CardContent className="p-3 md:p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                          {/* Coluna 1: Info Principal (Nome + Status) */}
                          <div className="col-span-1">
                            <div className="space-y-2">
                              <div>
                                <h3 className="text-xs md:text-lg font-semibold text-white group-hover:text-orange-400 transition-colors truncate line-clamp-2">
                                  {centro.name}
                                </h3>
                              </div>
                              <div>
                                {getStatusBadge(displayStatus)}
                              </div>
                            </div>
                          </div>

                          {/* Coluna 2: Telefone */}
                          <div className="col-span-1">
                            <div className="space-y-1">
                              <p className="text-xs text-blue-400 font-semibold">Tel.</p>
                              <div className="flex items-center gap-1 text-blue-300 text-xs md:text-sm">
                                <Phone className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                                <span className="truncate">{centro.phone || "-"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Coluna 3: Plano */}
                          <div className="col-span-1">
                            <div className="space-y-1">
                              <p className="text-xs text-blue-400 font-semibold">Plano</p>
                              <p className="text-xs md:text-sm text-white capitalize">
                                {subscriptions[centro.id]?.plan || "Sem plano"}
                              </p>
                            </div>
                          </div>

                          {/* Coluna 4: Tempo Restante */}
                          <div className="col-span-1">
                            <div className="space-y-1">
                              <p className="text-xs text-blue-400 font-semibold">Restante</p>
                              <p
                                className={`text-xs md:text-sm font-semibold ${
                                  daysRemaining <= 7
                                    ? "text-orange-400"
                                    : daysRemaining <= 30
                                      ? "text-yellow-400"
                                      : "text-green-400"
                                }`}
                              >
                                {daysRemaining > 0 ? `${daysRemaining}d` : "Exp"}
                              </p>
                            </div>
                          </div>

                          {/* Coluna 5: Localização (com span de 2) */}
                          <div className="col-span-2 md:col-span-2">
                            <div className="flex items-center gap-2 text-blue-300 text-xs md:text-sm">
                              <MapPin className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                              <span className="truncate">{centro.address || "-"}</span>
                            </div>
                          </div>

                          {/* Coluna 6: Término (com span de 2, escondido no mobile) */}
                          <div className="hidden md:block md:col-span-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 md:h-4 md:w-4 text-blue-400 shrink-0" />
                              <div>
                                <p className="text-xs text-blue-400 font-semibold">Término:</p>
                                <p className="text-xs md:text-sm text-white">{planEndDateStr}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="border-blue-700 text-blue-200 hover:bg-blue-800/50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={
                          currentPage === page
                            ? "bg-orange-500 hover:bg-orange-600 text-white"
                            : "border-blue-700 text-blue-200 hover:bg-blue-800/50"
                        }
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="border-blue-700 text-blue-200 hover:bg-blue-800/50 disabled:opacity-50"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}

              {/* Info de paginação */}
              <div className="text-center mt-4 text-blue-300 text-sm">
                Mostrando {startIndex + 1} a {Math.min(endIndex, centros.length)} de {centros.length} centros
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
